// Canonical football position labels, mapped to their on-pitch order
// (goalkeeper through forward) for sorting - exact match only. Free-text or
// abbreviated labels (e.g. "Left Winger", "Backup GK") fall through to the
// partial-match fallback in getPositionSortOrder below.
const EXACT_POSITION_ORDER: Record<string, number> = {
  'goalkeeper': 0,
  'gk': 0,
  'goalkeeper (gk)': 0,
  'defender': 1,
  'def': 1,
  'defender (def)': 1,
  'centre-back': 1,
  'full-back': 1,
  'wing-back': 1,
  'midfielder': 2,
  'mid': 2,
  'midfielder (mid)': 2,
  'central midfielder': 2,
  'defensive midfielder': 2,
  'attacking midfielder': 2,
  'wide midfielder': 2,
  'forward': 3,
  'fwd': 3,
  'forward (fwd)': 3,
  'centre-forward': 3,
  'winger': 3,
  'striker': 3,
};

// Resolves a football position label to its on-pitch sort order (Goalkeeper
// 0, Defender 1, Midfielder 2, Forward 3), rather than sorting positions
// alphabetically - exact match first (case-insensitive), then a partial
// keyword match for less common or free-text labels. Returns null for an
// empty/unset position or one that matches no known keyword, so callers can
// decide how to treat "unknown" (e.g. always sort it last).
export function getPositionSortOrder(position: string | null | undefined): number | null {
  const pos = position?.toLowerCase().trim() || '';
  if (!pos) return null;

  const exact = EXACT_POSITION_ORDER[pos];
  if (exact !== undefined) return exact;

  if (pos.includes('goalkeeper') || pos.includes('gk')) return 0;
  if (pos.includes('defender') || pos.includes('def') || pos.includes('back')) return 1;
  if (pos.includes('midfielder') || pos.includes('mid')) return 2;
  if (pos.includes('forward') || pos.includes('fwd') || pos.includes('striker') || pos.includes('winger')) return 3;

  return null;
}
