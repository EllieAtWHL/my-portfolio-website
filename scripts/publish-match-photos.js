#!/usr/bin/env node

/**
 * Match-day Photo Publisher
 *
 * Companion to `navigate-to-images-and-optimise.bash`. Takes the same local
 * source folder name used with that script, resolves the corresponding
 * Supabase `matches` row from its date prefix, copies the optimised photos
 * into the correctly-named dated folder in the `spurs-women-photo-gallery`
 * repo, commits + pushes them, and upserts the match's `media` "photo
 * album" row to point at the new folder key.
 *
 * Local match folders are named inconsistently (dashes, mixed
 * capitalisation, full competition names, non-match folders like "End of
 * Season Q&A") so rather than parsing the folder name, this looks the match
 * up by its date prefix and builds the destination folder name from the
 * match record itself, matching the convention in
 * reference/photo-gallery/README.md exactly.
 *
 * Usage:
 *   node scripts/publish-match-photos.js "<local source folder name>" [--match-id=<uuid>]
 *   npm run publish-match-photos -- "<local source folder name>" [--match-id=<uuid>]
 *
 * The local source folder is expected to already have an `optimised/`
 * subfolder of .webp files, created by:
 *   ./scripts/navigate-to-images-and-optimise.bash "<same folder name>"
 *
 * --match-id=<uuid> skips the date lookup entirely (use it when the date
 * prefix is missing/ambiguous, or multiple matches share a date).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

// Maps `competitions.name` (as stored in Supabase) to the abbreviation used
// in the photo-gallery folder naming convention (see
// reference/photo-gallery/README.md). Add new competitions here as needed.
const COMPETITION_ABBREVIATIONS = {
  'Womens Super League': 'WSL',
  "Women's FA Cup": 'WFA Cup',
  "Women's League Cup": 'WLeague Cup',
  Friendly: 'Friendly',
};

const MATCH_SELECT = `
  id, date,
  home_team:home_team_id(id, name, short_name),
  away_team:away_team_id(id, name, short_name),
  competitions:competition_id(name)
`;

function parseArgs(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const matchIdArg = argv.find((arg) => arg.startsWith('--match-id='));
  return {
    folderName: positional[0],
    matchIdOverride: matchIdArg ? matchIdArg.split('=')[1] : null,
  };
}

function seasonForDate(isoDate) {
  const [year, month] = isoDate.split('-').map(Number);
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8' });
}

function hasStagedChanges(cwd) {
  try {
    run('git', ['diff', '--cached', '--quiet'], cwd);
    return false;
  } catch {
    return true;
  }
}

async function resolveMatch(supabase, folderName, matchIdOverride) {
  if (matchIdOverride) {
    const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('id', matchIdOverride).maybeSingle();
    if (error || !data) {
      console.error(`No match found for id ${matchIdOverride}${error ? `: ${error.message}` : ''}`);
      process.exit(1);
    }
    return data;
  }

  const dateMatch = folderName.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateMatch) {
    console.error(`Couldn't find a YYYYMMDD date prefix in "${folderName}" — pass --match-id=<uuid> instead.`);
    process.exit(1);
  }
  const isoDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('date', isoDate);
  if (error) {
    console.error(`Error querying matches for ${isoDate}: ${error.message}`);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No match found on ${isoDate}. Pass --match-id=<uuid> to link manually.`);
    process.exit(1);
  }
  if (data.length > 1) {
    console.error(`Multiple matches found on ${isoDate} — pass one of these as --match-id=<uuid>:`);
    data.forEach((m) => console.error(`  ${m.id}  ${m.home_team?.short_name} vs ${m.away_team?.short_name} (${m.competitions?.name})`));
    process.exit(1);
  }
  return data[0];
}

async function main() {
  const { folderName, matchIdOverride } = parseArgs(process.argv.slice(2));

  if (!folderName) {
    console.error('Usage: node scripts/publish-match-photos.js "<local source folder name>" [--match-id=<uuid>]');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const basePath = process.env.SPURS_IMAGES_BASE_PATH;
  if (!basePath) {
    console.error('Missing SPURS_IMAGES_BASE_PATH in .env.local');
    process.exit(1);
  }

  const sourceDir = path.join(basePath, folderName, 'optimised');
  if (!fs.existsSync(sourceDir)) {
    console.error(`No optimised photos found at ${sourceDir}`);
    console.error(`Run ./scripts/navigate-to-images-and-optimise.bash "${folderName}" first.`);
    process.exit(1);
  }

  const photoFiles = fs.readdirSync(sourceDir).filter((f) => f.toLowerCase().endsWith('.webp'));
  if (photoFiles.length === 0) {
    console.error(`No .webp files found in ${sourceDir}`);
    process.exit(1);
  }
  console.log(`Found ${photoFiles.length} optimised photo(s) in ${sourceDir}`);

  const match = await resolveMatch(supabase, folderName, matchIdOverride);

  const competitionName = match.competitions?.name;
  const competitionAbbrev = COMPETITION_ABBREVIATIONS[competitionName];
  if (!competitionAbbrev) {
    console.error(`Unknown competition "${competitionName}" — add it to COMPETITION_ABBREVIATIONS in this script.`);
    process.exit(1);
  }

  const isoDate = match.date.slice(0, 10);
  const dateToken = isoDate.replace(/-/g, '');
  const destFolderName = `${dateToken} ${competitionAbbrev} ${match.home_team?.short_name} vs ${match.away_team?.short_name}`;
  const folderKey = `${seasonForDate(isoDate)}/${destFolderName}`;

  console.log(`Matched to: ${match.home_team?.short_name} vs ${match.away_team?.short_name} (${competitionName}, ${isoDate}) — match ${match.id}`);
  console.log(`Destination folder: ${folderKey}`);

  const portfolioRoot = run('git', ['rev-parse', '--show-toplevel'], __dirname).trim();
  const galleryRepo = path.join(path.dirname(portfolioRoot), 'spurs-women-photo-gallery');

  if (!fs.existsSync(path.join(galleryRepo, '.git'))) {
    console.error(`Photo gallery repo not found at ${galleryRepo}`);
    process.exit(1);
  }

  run('git', ['pull', '--ff-only', 'origin', 'main'], galleryRepo);

  const destDir = path.join(galleryRepo, folderKey);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of photoFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
  }
  console.log(`Copied ${photoFiles.length} photo(s) into ${destDir}`);

  run('git', ['add', folderKey], galleryRepo);

  if (!hasStagedChanges(galleryRepo)) {
    console.log('No changes to commit — photos already up to date in the gallery repo.');
  } else {
    run('git', ['commit', '-m', `Add match photos for ${destFolderName}`], galleryRepo);
    console.log('Committed photos.');
    run('git', ['push', 'origin', 'main'], galleryRepo);
    console.log('Pushed to spurs-women-photo-gallery.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('media')
    .select('id')
    .eq('match_id', match.id)
    .eq('type', 'photo album')
    .maybeSingle();

  if (existingError) {
    console.error(`Error checking for existing media row: ${existingError.message}`);
    process.exit(1);
  }

  if (existing) {
    const { error } = await supabase.from('media').update({ url: folderKey }).eq('id', existing.id);
    if (error) {
      console.error(`Failed to update media row ${existing.id}: ${error.message}`);
      process.exit(1);
    }
    console.log(`Updated existing media row ${existing.id} -> ${folderKey}`);
  } else {
    const { data: inserted, error } = await supabase
      .from('media')
      .insert({
        match_id: match.id,
        type: 'photo album',
        url: folderKey,
        title: null,
        caption: null,
        sort_order: 0,
      })
      .select()
      .single();
    if (error) {
      console.error(`Failed to insert media row: ${error.message}`);
      process.exit(1);
    }
    console.log(`Created media row ${inserted.id} -> ${folderKey}`);
  }

  console.log("Done. The gallery repo's own GitHub Action will regenerate the manifest and open an auto-merging PR against this repo shortly.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
