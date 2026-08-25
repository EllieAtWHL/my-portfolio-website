#!/usr/bin/env node

/**
 * Player Stats Coverage Survey
 *
 * Read-only survey of completed Spurs Women matches (matches.spurs_score is not
 * null) that are missing core-lineup player_stats coverage. Used by the WEB-114
 * weekly research routine to find matches to source, and can be run manually
 * (`npm run find-missing-player-stats`) for the same one-off check WEB-113 did.
 *
 * Read-only: uses the public anon Supabase client (same credential already
 * shipped to every browser), never the service-role key. Makes no writes.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SINCE_DAYS_DEFAULT = 21;

// Fields fetched per row (the "core lineup" definition from WEB-113).
const CORE_FIELDS = [
  'started',
  'captain',
  'was_substitute',
  'was_unused_substitute',
  'minute_on',
  'minute_off',
  'minutes_played',
  'goals',
  'assists',
  'yellow_cards',
  'red_cards',
];

// Fields that should always be non-null for a player known to have appeared.
// minute_on/minute_off are legitimately null for non-substitutes, and
// existing data stores non-captains inconsistently as `false` or `null` —
// both mean "not captain" in practice, so `captain` isn't a reliable
// completeness signal and is excluded here.
const REQUIRED_NON_NULL_FIELDS = CORE_FIELDS.filter(
  (field) => !['captain', 'minute_on', 'minute_off'].includes(field)
);

function parseArgs(argv) {
  const sinceDaysArg = argv.find((arg) => arg.startsWith('--since-days='));
  return {
    sinceDays: sinceDaysArg ? parseInt(sinceDaysArg.split('=')[1], 10) : SINCE_DAYS_DEFAULT,
  };
}

async function main() {
  const { sinceDays } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: tottenham, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('is_tottenham', true)
    .single();

  if (teamError || !tottenham) {
    console.error('Could not resolve Tottenham team row:', teamError?.message);
    process.exit(1);
  }

  const sinceDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      id,
      date,
      spurs_score,
      opponent_score,
      home_team:home_team_id(id, name, is_tottenham),
      away_team:away_team_id(id, name, is_tottenham),
      competitions:competition_id(name)
    `)
    .not('spurs_score', 'is', null)
    .gte('date', sinceDate)
    .order('date', { ascending: false });

  if (matchesError) {
    console.error('Error fetching matches:', matchesError.message);
    process.exit(1);
  }

  const results = [];
  for (const match of matches || []) {
    const opponent = match.home_team?.is_tottenham ? match.away_team : match.home_team;

    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select(CORE_FIELDS.join(', '))
      .eq('match_id', match.id)
      .eq('team_id', tottenham.id);

    if (statsError) {
      console.error(`Error fetching player_stats for match ${match.id}:`, statsError.message);
      continue;
    }

    let status;
    if (!stats || stats.length === 0) {
      status = 'missing';
    } else if (stats.some((row) => REQUIRED_NON_NULL_FIELDS.some((field) => row[field] === null))) {
      status = 'partial';
    } else {
      status = 'complete';
    }

    if (status === 'complete') continue;

    results.push({
      matchId: match.id,
      date: match.date,
      opponent: opponent?.name ?? 'Unknown opponent',
      competition: match.competitions?.name ?? 'Unknown competition',
      score: `${match.spurs_score}-${match.opponent_score}`,
      playerStatsRowCount: stats?.length ?? 0,
      status,
    });
  }

  console.log(`Checked ${matches?.length ?? 0} completed match(es) since ${sinceDate}.`);
  console.log(`${results.length} need player_stats research:\n`);
  for (const r of results) {
    console.log(`  [${r.status}] ${r.date} vs ${r.opponent} (${r.competition}, ${r.score}) — match ${r.matchId}, ${r.playerStatsRowCount} existing row(s)`);
  }

  console.log('\n---JSON---');
  console.log(JSON.stringify(results, null, 2));
}

main();
