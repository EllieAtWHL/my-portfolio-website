#!/usr/bin/env node

/**
 * Apply Player Stats
 *
 * Writes Tottenham `player_stats` rows for one match from a JSON data file,
 * shaped to be a near-direct transcription of a WEB-114 research ticket's
 * tables (see reference/spurs-women/player-stats-research-job.md). Resolves
 * player names to existing `player_id`s, sanity-checks the data against the
 * match record, and writes via the production service-role key - the same
 * credential `src/lib/admin-api.ts` uses for the admin UI, used directly
 * here instead of through that UI. This is a deliberately human-run,
 * human-reviewed step, not something to wire into the automated WEB-114
 * routine - see that doc for why.
 *
 * Usage:
 *   npm run apply-player-stats -- path/to/data.json           # dry run (default)
 *   npm run apply-player-stats -- path/to/data.json --apply   # writes for real
 *   npm run apply-player-stats -- path/to/data.json --apply --force  # skip the
 *     "rows already exist for this match" guard (use to correct/add to a
 *     match that was partially entered)
 *
 * Data file shape:
 * {
 *   "matchId": "<matches.idUUID>",
 *   "players": [
 *     { "name": "Lize Kop", "started": true, "minutesPlayed": 90 },
 *     { "name": "Julie Blakstad", "started": true, "minutesPlayed": 75, "minuteOff": 75 },
 *     { "name": "Drew Spence", "started": true, "captain": true, "minutesPlayed": 90 },
 *     { "name": "Olivia Holdt", "started": true, "minutesPlayed": 74, "minuteOff": 74,
 *       "goals": 3, "playerOfTheMatch": true },
 *     { "name": "Alice Sombath", "substitute": true, "minuteOn": 75, "minutesPlayed": 15 },
 *     { "name": "Ella Morris", "unusedSubstitute": true }
 *   ]
 * }
 *
 * Each player needs exactly one of started / substitute / unusedSubstitute
 * set to true. Everything else defaults sensibly (see DEFAULTS below) -
 * only include the fields the source actually reports, matching the
 * existing convention of leaving unsourced nullable stat fields (shots,
 * passes, tackles, clean_sheet, player_rating, ...) null rather than
 * guessing 0. `name` is resolved against `players.first_name || ' ' ||
 * last_name` (case-insensitive); if that's ambiguous or the source only
 * gave a partial name (e.g. "A. Sombath"), pass `"playerId"` instead to
 * skip resolution for that entry.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const DEFAULTS = {
  captain: false,
  minuteOn: null,
  minuteOff: null,
  minutesPlayed: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  // shots/shotsOnTarget are non-nullable columns but BBC-sourced research
  // never reports them per-player - 0 would falsely claim "took no shots"
  // rather than "not sourced", so these stay null like the truly-nullable
  // fields (clean_sheet, passes_*, etc.) unless an entry explicitly sets them.
  shots: null,
  shotsOnTarget: null,
  playerOfTheMatch: false,
};

function parseArgs(argv) {
  const positional = argv.filter((a) => !a.startsWith('--'));
  return {
    dataFile: positional[0],
    apply: argv.includes('--apply'),
    force: argv.includes('--force'),
  };
}

async function resolvePlayer(supabase, entry) {
  if (entry.playerId) return { id: entry.playerId, source: 'explicit playerId' };

  const name = entry.name.trim();
  const { data: exact, error: exactError } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .ilike('first_name', name.split(' ')[0])
    .ilike('last_name', name.split(' ').slice(1).join(' '));
  if (exactError) throw new Error(`Lookup failed for "${name}": ${exactError.message}`);
  if (exact.length === 1) return { id: exact[0].id, source: 'exact name match' };

  const lastWord = name.split(' ').slice(-1)[0];
  const { data: byLastName, error: lastNameError } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .ilike('last_name', `%${lastWord}%`);
  if (lastNameError) throw new Error(`Lookup failed for "${name}": ${lastNameError.message}`);

  if (byLastName.length === 1) return { id: byLastName[0].id, source: `unique last-name match on "${lastWord}"` };
  if (byLastName.length === 0) {
    throw new Error(`No player found matching "${name}" (tried exact name and last name "${lastWord}"). Add "playerId" to this entry instead.`);
  }
  const candidates = byLastName.map((p) => `${p.first_name} ${p.last_name} (${p.id})`).join('; ');
  throw new Error(`"${name}" is ambiguous — candidates: ${candidates}. Add "playerId" to this entry instead.`);
}

function toRow({ playerId, entry, matchId, teamId }) {
  const flags = ['started', 'substitute', 'unusedSubstitute'].filter((f) => entry[f]);
  if (flags.length !== 1) {
    throw new Error(`"${entry.name || entry.playerId}" must set exactly one of started/substitute/unusedSubstitute (got: ${flags.join(', ') || 'none'})`);
  }

  return {
    player_id: playerId,
    match_id: matchId,
    team_id: teamId,
    started: !!entry.started,
    captain: entry.captain ?? DEFAULTS.captain,
    was_substitute: !!entry.substitute,
    was_unused_substitute: !!entry.unusedSubstitute,
    minute_on: entry.minuteOn ?? DEFAULTS.minuteOn,
    minute_off: entry.minuteOff ?? DEFAULTS.minuteOff,
    minutes_played: entry.minutesPlayed ?? DEFAULTS.minutesPlayed,
    goals: entry.goals ?? DEFAULTS.goals,
    assists: entry.assists ?? DEFAULTS.assists,
    yellow_cards: entry.yellowCards ?? DEFAULTS.yellowCards,
    red_cards: entry.redCards ?? DEFAULTS.redCards,
    shots: entry.shots ?? DEFAULTS.shots,
    shots_on_target: entry.shotsOnTarget ?? DEFAULTS.shotsOnTarget,
    player_of_the_match: entry.playerOfTheMatch ?? DEFAULTS.playerOfTheMatch,
  };
}

async function main() {
  const { dataFile, apply, force } = parseArgs(process.argv.slice(2));
  if (!dataFile) {
    console.error('Usage: npm run apply-player-stats -- path/to/data.json [--apply] [--force]');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { matchId, players } = JSON.parse(fs.readFileSync(path.resolve(dataFile), 'utf8'));
  if (!matchId || !Array.isArray(players) || players.length === 0) {
    console.error('Data file must have a "matchId" and a non-empty "players" array.');
    process.exit(1);
  }

  const { data: tottenham, error: teamError } = await supabase
    .from('teams').select('id, name').eq('is_tottenham', true).single();
  if (teamError || !tottenham) {
    console.error('Could not resolve Tottenham team row:', teamError?.message);
    process.exit(1);
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, date, spurs_score, opponent_score, is_home_match, home_team:home_team_id(name, is_tottenham), away_team:away_team_id(name, is_tottenham)')
    .eq('id', matchId)
    .single();
  if (matchError || !match) {
    console.error(`Could not find match ${matchId}:`, matchError?.message);
    process.exit(1);
  }
  const opponent = match.home_team?.is_tottenham ? match.away_team : match.home_team;
  console.log(`Match: ${match.date} Tottenham Hotspur ${match.spurs_score}-${match.opponent_score} ${opponent?.name ?? 'Unknown opponent'} (${match.is_home_match ? 'home' : 'away'})`);

  const { data: existing, error: existingError } = await supabase
    .from('player_stats').select('id, goals').eq('match_id', matchId).eq('team_id', tottenham.id);
  if (existingError) {
    console.error('Could not check for existing player_stats rows:', existingError.message);
    process.exit(1);
  }
  if (existing.length > 0 && !force) {
    console.error(`${existing.length} player_stats row(s) already exist for this match. Re-run with --force to add to them anyway (this will NOT overwrite or dedupe existing rows), or delete them first if you're re-entering from scratch.`);
    process.exit(1);
  }

  const resolved = await Promise.all(
    players.map(async (entry) => ({ entry, ...(await resolvePlayer(supabase, entry)) }))
  );
  const rows = resolved.map(({ entry, id: playerId, source }) => {
    const row = toRow({ playerId, entry, matchId, teamId: tottenham.id });
    console.log(`  ${entry.name ?? playerId} -> ${playerId} (${source}) — ${row.started ? 'started' : row.was_substitute ? 'sub' : 'unused sub'}, ${row.minutes_played}m, g${row.goals} a${row.assists} y${row.yellow_cards} r${row.red_cards}${row.player_of_the_match ? ', POTM' : ''}`);
    return row;
  });

  const existingGoalsSum = existing.reduce((sum, r) => sum + (r.goals ?? 0), 0);
  const goalsSum = existingGoalsSum + rows.reduce((sum, r) => sum + r.goals, 0);
  if (goalsSum !== match.spurs_score) {
    console.warn(`\nWarning: summed goals (${goalsSum}${existingGoalsSum ? `, including ${existingGoalsSum} from ${existing.length} already-entered row(s)` : ''}) don't match match.spurs_score (${match.spurs_score}). Double-check before applying.`);
  }

  if (!apply) {
    console.log(`\nDry run — ${rows.length} row(s) ready, nothing written. Re-run with --apply to write to production.`);
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('player_stats').insert(rows).select('id');
  if (insertError) {
    console.error('Insert failed:', insertError.message);
    process.exit(1);
  }
  console.log(`\nInserted ${inserted.length} player_stats row(s) for match ${matchId}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
