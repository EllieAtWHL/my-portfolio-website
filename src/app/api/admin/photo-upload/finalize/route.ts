import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { buildGalleryFolderKey } from '@/lib/photo-gallery-folder';
import { finalizeGalleryBatch, type GalleryBlobEntry } from '@/lib/photo-gallery-github';

// WEB-149: the single point where an upload batch actually pushes to
// spurs-women-photo-gallery's `main` - see the comment in
// ../route.ts for why this is split out from the per-photo route (one push
// per whole album, not one per photo, so the gallery repo's manifest
// webhook fires once).

export const runtime = 'nodejs';
export const maxDuration = 30;

const MATCH_SELECT = `
  id, date,
  home_team:home_team_id(short_name),
  away_team:away_team_id(short_name),
  competitions:competition_id(name)
`;

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
    const body = await request.json();
    const { matchId, blobs } = body as { matchId?: string; blobs?: GalleryBlobEntry[] };

    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json({ error: 'Missing "matchId"' }, { status: 400 });
    }
    if (!Array.isArray(blobs) || blobs.length === 0) {
      return NextResponse.json({ error: 'Missing or empty "blobs" array' }, { status: 400 });
    }
    if (!blobs.every((b) => b && typeof b.path === 'string' && typeof b.sha === 'string')) {
      return NextResponse.json({ error: 'Each blob entry needs a "path" and "sha"' }, { status: 400 });
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

    const message = blobs.length === 1
      ? `Add match photo ${blobs[0].path.split('/').pop()}`
      : `Add ${blobs.length} match photos for ${folderKey}`;

    const { skipped, commitSha } = await finalizeGalleryBatch(blobs, message);
    const mediaId = await upsertPhotoAlbumMedia(matchId, folderKey);

    return NextResponse.json(
      handleApiSuccess(
        { folderKey, mediaId, commitSha, skipped, photoCount: blobs.length },
        skipped ? 'Already published' : `Published ${blobs.length} photo(s)`
      )
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Failed to finalize photo batch'), { status: 500 });
  }
}
