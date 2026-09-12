import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { buildGalleryFolderKey } from '@/lib/photo-gallery-folder';
import { galleryFileExists, commitFileToGallery } from '@/lib/photo-gallery-github';

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

async function upsertPhotoAlbumMedia(matchId: string, folderKey: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('media')
    .select('id, url')
    .eq('match_id', matchId)
    .eq('type', 'photo album')
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check existing media row: ${existingError.message}`);
  }

  if (existing) {
    if (existing.url !== folderKey) {
      const { error } = await supabaseAdmin.from('media').update({ url: folderKey }).eq('id', existing.id);
      if (error) throw new Error(`Failed to update media row ${existing.id}: ${error.message}`);
    }
    return existing.id as string;
  }

  const { data: inserted, error } = await supabaseAdmin
    .from('media')
    .insert({ match_id: matchId, type: 'photo album', url: folderKey, title: null, caption: null, sort_order: 0 })
    .select('id')
    .single();
  if (error) {
    throw new Error(`Failed to create media row: ${error.message}`);
  }
  return inserted.id as string;
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

    // Idempotency: if a client retries this exact photo (e.g. after a
    // dropped connection), the filename is stable (same original name in
    // the same folder), so a second attempt finds it already committed and
    // skips straight to the media-row upsert instead of erroring or
    // duplicating the file.
    const alreadyCommitted = await galleryFileExists(path);
    if (!alreadyCommitted) {
      await commitFileToGallery(path, optimisedBuffer.toString('base64'), `Add match photo ${filename}`);
    }

    const mediaId = await upsertPhotoAlbumMedia(matchId, folderKey);

    return NextResponse.json(
      handleApiSuccess(
        {
          path,
          folderKey,
          mediaId,
          skipped: alreadyCommitted,
          originalSizeBytes: originalBuffer.length,
          optimisedSizeBytes: optimisedBuffer.length,
        },
        alreadyCommitted ? 'Photo already uploaded' : 'Photo uploaded'
      )
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Photo upload failed'), { status: 500 });
  }
}
