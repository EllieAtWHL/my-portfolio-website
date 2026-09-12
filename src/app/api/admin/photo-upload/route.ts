import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { buildGalleryFolderKey } from '@/lib/photo-gallery-folder';
import { createBlob } from '@/lib/photo-gallery-github';

// WEB-149: the real mobile upload feature, built on the WEB-148 spike's
// proven resize+commit mechanism (see
// reference/photo-gallery/README.md ("Adding photos from a phone")). Auth/CSRF/rate-limit
// are already enforced for every /api/admin/* route in
// src/lib/supabase/middleware.ts - this route adds nothing on top of that.
//
// One photo per request by design (per WEB-148/WEB-149 findings): keeps
// each request well clear of serverless duration limits and isolates a
// failure to one photo instead of the whole album. The client is
// responsible for looping over a multi-photo selection and retrying
// individual failures.
//
// This route only resizes/compresses the photo and creates a git blob for
// it - it does NOT push to the gallery repo's `main` or touch the `media`
// row. That happens once for the whole batch in
// /api/admin/photo-upload/finalize, so an album of N photos triggers the
// gallery repo's manifest-regeneration webhook exactly once, not N times
// (seeing N of those in a row was what caused a pile-up of near-duplicate
// auto-merging PRs and congested CI/Vercel during WEB-149 testing).

// sharp's native bindings need the Node.js runtime, not the Edge runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

const MATCH_SELECT = `
  id, date,
  home_team:home_team_id(short_name),
  away_team:away_team_id(short_name),
  competitions:competition_id(name)
`;

// Camera filenames (e.g. "PXL_20260208_143022.jpg") are kept as the basename
// so the gallery folder reads the same as photos published via the desktop
// pipeline - only the extension changes, matching
// scripts/navigate-to-images-and-optimise.bash's ImageMagick conversion.
function toWebpFilename(originalName: string): string {
  const base = originalName.replace(/\.[^./]+$/, '');
  const safe = base.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'photo';
  return `${safe}.webp`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo');
    const matchId = formData.get('matchId');

    if (!photo || !(photo instanceof File)) {
      return NextResponse.json({ error: 'Missing "photo" file in form data' }, { status: 400 });
    }
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: `Expected an image, got "${photo.type}"` }, { status: 400 });
    }
    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json({ error: 'Missing "matchId" in form data' }, { status: 400 });
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(MATCH_SELECT)
      .eq('id', matchId)
      .maybeSingle();

    if (matchError || !match) {
      return NextResponse.json(
        { error: matchError ? `Failed to look up match: ${matchError.message}` : `No match found for id ${matchId}` },
        { status: 400 }
      );
    }

    // supabase-js's generic (schema-less) query typing infers these FK
    // embeds as arrays even though PostgREST returns a single object for a
    // to-one relationship at runtime (matches the shape scripts/publish-match-photos.js
    // already relies on) - unwrap defensively so this compiles without
    // assuming which one is actually correct.
    const unwrapOne = <T,>(value: T | T[] | null): T | null =>
      Array.isArray(value) ? value[0] ?? null : value;

    let folderKey: string;
    try {
      folderKey = buildGalleryFolderKey({
        date: match.date,
        home_team: unwrapOne(match.home_team),
        away_team: unwrapOne(match.away_team),
        competitions: unwrapOne(match.competitions),
      });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await photo.arrayBuffer());

    // Dynamic import so a native-load failure lands in this try/catch and
    // comes back as a real JSON error instead of crashing the route module
    // (see reference/photo-gallery/README.md ("Adding photos from a phone")).
    const sharp = (await import('sharp')).default;

    const optimisedBuffer = await sharp(originalBuffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .rotate() // apply EXIF orientation before stripping metadata
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const filename = toWebpFilename(photo.name || 'photo');
    const path = `${folderKey}/${filename}`;

    const blobSha = await createBlob(optimisedBuffer.toString('base64'));

    return NextResponse.json(
      handleApiSuccess(
        {
          path,
          folderKey,
          blobSha,
          originalSizeBytes: originalBuffer.length,
          optimisedSizeBytes: optimisedBuffer.length,
        },
        'Photo processed'
      )
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Photo upload failed'), { status: 500 });
  }
}
