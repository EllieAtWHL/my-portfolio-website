-- WEB-61: matches.home_team_id, matches.away_team_id, and matches.stadium_id were
-- unindexed (confirmed via `supabase inspect db index-stats --linked`), despite being
-- exactly the columns generic-fetchers.ts's match-count queries filter on.
create index if not exists idx_matches_home_team_id on public.matches (home_team_id);
create index if not exists idx_matches_away_team_id on public.matches (away_team_id);
create index if not exists idx_matches_stadium_id on public.matches (stadium_id);
