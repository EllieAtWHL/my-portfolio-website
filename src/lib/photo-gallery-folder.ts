// Mirrors the folder-naming convention in scripts/publish-match-photos.js
// (the desktop pipeline) exactly - both need to agree on the same
// SEASON/YYYYMMDD Competition Team1 vs Team2 key, since either path can
// create/update the same match's `media` "photo album" row. Kept as a
// separate TS copy rather than a shared import because the desktop script is
// plain CommonJS run standalone via `.env.local` (see
// reference/photo-gallery/README.md), not part of the Next.js build - if you
// add a competition here, add it there too.
const COMPETITION_ABBREVIATIONS: Record<string, string> = {
  'Womens Super League': 'WSL',
  "Women's FA Cup": 'WFA Cup',
  "Women's League Cup": 'WLeague Cup',
  Friendly: 'Friendly',
};

export interface MatchForFolderKey {
  date: string;
  home_team: { short_name: string } | null;
  away_team: { short_name: string } | null;
  competitions: { name: string } | null;
}

function seasonForDate(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/**
 * Builds the gallery folder key (e.g. "2025-26/20260208 WSL Spurs vs
 * Chelsea") for a match, matching the convention in
 * reference/photo-gallery/README.md. Throws if the match's competition isn't
 * in COMPETITION_ABBREVIATIONS.
 */
export function buildGalleryFolderKey(match: MatchForFolderKey): string {
  const competitionName = match.competitions?.name ?? '';
  const competitionAbbrev = COMPETITION_ABBREVIATIONS[competitionName];
  if (!competitionAbbrev) {
    throw new Error(
      `Unknown competition "${competitionName}" - add it to COMPETITION_ABBREVIATIONS in src/lib/photo-gallery-folder.ts (and scripts/publish-match-photos.js).`
    );
  }

  const isoDate = match.date.slice(0, 10);
  const dateToken = isoDate.replace(/-/g, '');
  const destFolderName = `${dateToken} ${competitionAbbrev} ${match.home_team?.short_name} vs ${match.away_team?.short_name}`;
  return `${seasonForDate(isoDate)}/${destFolderName}`;
}
