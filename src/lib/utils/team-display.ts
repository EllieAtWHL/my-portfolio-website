interface TeamLike {
  short_name?: string | null;
  name?: string | null;
}

// Prefer a team's short_name over its full name (e.g. "Chelsea" over "Chelsea FC
// Women") wherever a single display value is needed - already duplicated
// independently in MatchNavigation.tsx and PlayersTabPanel.tsx's opponent-name
// resolution before this was extracted (WEB-169); new callers should use this
// instead of re-writing the same fallback again. Not a fit for useMatchesAdmin.ts's
// search filter, which deliberately checks both fields rather than picking one.
export function getTeamDisplayName(team: TeamLike | null | undefined, fallback = 'Unknown Team'): string {
  return team?.short_name || team?.name || fallback;
}
