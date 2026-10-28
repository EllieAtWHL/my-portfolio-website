#!/usr/bin/env node

/**
 * Import Groundhopper Stadiums (WEB-222)
 *
 * Adds the current home grounds of the Premier League, EFL, Scottish
 * Premiership, WSL and WSL 2 to `stadia` as Groundhopper-only grounds
 * (spurs_women = false), so the game has a bigger pool without those grounds
 * appearing on the Spurs Women pages. Re-run each season: clubs get promoted
 * and relegated, and re-runs match on wikidata_qid, so nothing is duplicated.
 *
 * Where the data comes from:
 * - Which grounds are in use this season: each league's current-season
 *   Wikipedia article ("Stadiums and locations" table). Wikidata's own league
 *   membership data is too patchy for this (most seasons list no participants).
 * - The facts about each ground (coordinates, capacity, opening date,
 *   country, town): Wikidata (CC0), via the item each table row links to.
 *
 * Never overwrites: a ground already in `stadia` (same wikidata_qid, or within
 * 500 m) only gets its wikidata_qid and any blank fields filled, and its
 * spurs_women flag is left alone. See scripts/lib/groundhopper-stadium-import.js.
 *
 * Usage:
 *   npm run import-groundhopper-stadiums                      # dry run (default)
 *   npm run import-groundhopper-stadiums -- --apply           # writes to production
 *   npm run import-groundhopper-stadiums -- --season=2027–28  # a specific season
 *
 * After a successful --apply it revalidates the production site's `stadiums`
 * cache tag (needs CACHE_API_KEY in .env.local; SITE_URL overrides the
 * default production URL). See reference/spurs-women/groundhopper/README.md.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const {
  parseStadiumTable,
  cleanStadiumName,
  parseWktPoint,
  wikidataDate,
  currentSeason,
  placeFromAddress,
  planImport,
} = require('./lib/groundhopper-stadium-import');

const LEAGUES = [
  { name: 'Premier League', article: (season) => `${season} Premier League` },
  { name: 'EFL Championship', article: (season) => `${season} EFL Championship` },
  { name: 'EFL League One', article: (season) => `${season} EFL League One` },
  { name: 'EFL League Two', article: (season) => `${season} EFL League Two` },
  { name: 'Scottish Premiership', article: (season) => `${season} Scottish Premiership` },
  { name: "Women's Super League", article: (season) => `${season} Women's Super League` },
  { name: "Women's Super League 2", article: (season) => `${season} Women's Super League 2` },
];

// Wikidata items for the UK's four countries - a ground's country is
// whichever of these it's (transitively) located in.
const COUNTRIES = { Q21: 'England', Q25: 'Wales', Q22: 'Scotland', Q26: 'Northern Ireland' };

const USER_AGENT = 'ellieatwhl-groundhopper-import/1.0 (https://www.ellieatwhl.co.uk/spurs-women/groundhopper)';

function parseArgs(argv) {
  const season = argv.find((a) => a.startsWith('--season='));
  return {
    apply: argv.includes('--apply'),
    season: season ? season.split('=')[1] : currentSeason(),
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wikipedia and the Wikidata query service both rate-limit (HTTP 429) quite
// readily, so space requests out and back off on 429/5xx.
async function politeFetchJson(url, options = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(attempt === 0 ? 1000 : 5000 * 2 ** (attempt - 1));
    const res = await fetch(url, {
      ...options,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...(options.headers || {}) },
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} from ${url}`);
    console.warn(`  (HTTP ${res.status}, retrying)`);
  }
  throw new Error(`Gave up after repeated rate limiting: ${url}`);
}

function wikipedia(params) {
  const query = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  return politeFetchJson(`https://en.wikipedia.org/w/api.php?${query}`);
}

async function fetchLeagueRows(league, season) {
  const page = league.article(season);
  const { parse } = await wikipedia({ action: 'parse', page, prop: 'sections' });
  const sections = parse?.sections || [];
  const section =
    sections.find((s) => /stadium/i.test(s.line)) ||
    sections.find((s) => /^teams?$/i.test(s.line.trim())) ||
    sections.find((s) => /team|club/i.test(s.line));
  if (!section) {
    console.warn(`  ${league.name}: no stadium/teams section in "${page}" - skipped`);
    return [];
  }
  const { parse: sectionParse } = await wikipedia({ action: 'parse', page, prop: 'wikitext', section: section.index });
  const rows = parseStadiumTable(sectionParse.wikitext);
  console.log(`  ${league.name}: ${rows.length} grounds from "${page}" § ${section.line}`);
  return rows.map((row) => ({ ...row, league: league.name }));
}

// Wikipedia titles -> Wikidata QIDs, following redirects.
async function resolveQids(titles) {
  const qids = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const { query } = await wikipedia({
      action: 'query',
      prop: 'pageprops',
      ppprop: 'wikibase_item',
      redirects: '1',
      titles: batch.join('|'),
    });
    const renamed = new Map();
    for (const { from, to } of [...(query.normalized || []), ...(query.redirects || [])]) renamed.set(from, to);
    const finalTitle = (title) => {
      let current = title;
      for (let hops = 0; renamed.has(current) && hops < 5; hops++) current = renamed.get(current);
      return current;
    };
    const byTitle = new Map((query.pages || []).map((page) => [page.title, page]));
    for (const title of batch) {
      const page = byTitle.get(finalTitle(title));
      qids.set(title, { qid: page?.pageprops?.wikibase_item || null, title: page?.title || title });
    }
  }
  return qids;
}

async function fetchWikidataFacts(qids) {
  const facts = new Map();
  for (let i = 0; i < qids.length; i += 50) {
    const values = qids.slice(i, i + 50).map((q) => `wd:${q}`).join(' ');
    const sparql = `
      SELECT ?item ?coord ?capacity ?opened ?openedPrecision ?country ?placeLabel WHERE {
        VALUES ?item { ${values} }
        OPTIONAL { ?item wdt:P625 ?coord }
        OPTIONAL { ?item wdt:P1083 ?capacity }
        OPTIONAL { ?item p:P1619/psv:P1619 [ wikibase:timeValue ?opened ; wikibase:timePrecision ?openedPrecision ] }
        OPTIONAL { ?item wdt:P131* ?country . VALUES ?country { ${Object.keys(COUNTRIES).map((q) => `wd:${q}`).join(' ')} } }
        OPTIONAL { ?item wdt:P131 ?place }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`;
    const data = await politeFetchJson('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
      body: new URLSearchParams({ query: sparql }).toString(),
    });
    for (const row of data.results.bindings) {
      const qid = row.item.value.split('/').pop();
      const entry = facts.get(qid) || { coords: null, capacity: null, openedDate: null, country: null, place: null };
      entry.coords = entry.coords || parseWktPoint(row.coord?.value);
      const capacity = row.capacity ? Math.round(Number(row.capacity.value)) : null;
      // Several capacities usually means old and current figures; the largest is
      // the all-seated football capacity far more often than not.
      if (capacity && (!entry.capacity || capacity > entry.capacity)) entry.capacity = capacity;
      const opened = row.opened ? wikidataDate(row.opened.value, row.openedPrecision?.value) : null;
      if (opened && (!entry.openedDate || opened < entry.openedDate)) entry.openedDate = opened;
      entry.country = entry.country || (row.country ? COUNTRIES[row.country.value.split('/').pop()] : null);
      entry.place = entry.place || row.placeLabel?.value || null;
      facts.set(qid, entry);
    }
  }
  return facts;
}

// OpenStreetMap's usage policy allows one request a second, which
// politeFetchJson's spacing respects; only used for the handful of grounds
// that need it (see placeFromAddress). Zoom 10 is city level: at 12, edge-of-
// town grounds come back as the next village (McDiarmid Park as Scone, not Perth).
async function reverseGeocode({ latitude, longitude }) {
  const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: 'jsonv2', zoom: '10', addressdetails: '1' });
  const result = await politeFetchJson(`https://nominatim.openstreetmap.org/reverse?${query}`);
  return placeFromAddress(result.address);
}

function printPlan({ inserts, updates, unchanged, skipped }) {
  console.log(`\nNew Groundhopper-only grounds (${inserts.length}):`);
  for (const row of inserts) {
    console.log(`  + ${row.name} (${row.city ?? '?'}, ${row.country ?? '?'}) ${row.latitude}, ${row.longitude} cap ${row.capacity ?? '-'} opened ${row.opened_date ?? '-'} [${row.wikidata_qid}] slug=${row.slug}`);
  }
  console.log(`\nExisting grounds linked/filled (${updates.length}) - only blank fields, spurs_women untouched:`);
  for (const u of updates) {
    console.log(`  ~ ${u.name} <- ${u.ground.name} [${u.ground.qid}] (${u.matchedBy}): ${JSON.stringify(u.patch)}`);
  }
  console.log(`\nAlready linked, nothing to change (${unchanged.length}):`);
  for (const u of unchanged) console.log(`  = ${u.name} [${u.ground.qid}] (${u.matchedBy})`);
  console.log(`\nSkipped (${skipped.length}):`);
  for (const s of skipped) console.log(`  ! ${s.ground.name} [${s.ground.qid || 'no QID'}] - ${s.reason}`);
}

async function main() {
  const { apply, season } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Season ${season} - reading league tables from Wikipedia...`);
  const rows = [];
  for (const league of LEAGUES) rows.push(...(await fetchLeagueRows(league, season)));

  // One entry per ground: clubs share grounds (e.g. most WSL sides with their men's club).
  const byTitle = new Map();
  for (const row of rows) {
    const entry = byTitle.get(row.stadiumTitle) || { title: row.stadiumTitle, city: row.city, clubs: [], leagues: new Set() };
    entry.city = entry.city || row.city;
    entry.clubs.push(row.club);
    entry.leagues.add(row.league);
    byTitle.set(row.stadiumTitle, entry);
  }
  console.log(`\n${byTitle.size} distinct grounds across ${rows.length} clubs. Resolving Wikidata items...`);

  const resolved = await resolveQids([...byTitle.keys()]);
  const qids = [...new Set([...resolved.values()].map((r) => r.qid).filter(Boolean))];
  console.log(`Fetching facts for ${qids.length} Wikidata items...`);
  const facts = await fetchWikidataFacts(qids);

  console.log('Filling in missing towns/countries from OpenStreetMap where needed...');
  const seen = new Set();
  const imported = [];
  for (const [title, entry] of byTitle) {
    const { qid, title: finalTitle } = resolved.get(title);
    if (qid && seen.has(qid)) continue; // two table links redirecting to one ground
    if (qid) seen.add(qid);
    const fact = (qid && facts.get(qid)) || {};
    let city = entry.city;
    let country = fact.country;
    if ((!city || !country) && fact.coords) {
      const place = await reverseGeocode(fact.coords);
      city = city || place.city;
      country = country || place.country;
    }
    imported.push({
      qid,
      name: cleanStadiumName(finalTitle),
      city: city || fact.place || null,
      country: country || null,
      latitude: fact.coords?.latitude,
      longitude: fact.coords?.longitude,
      capacity: fact.capacity || null,
      openedDate: fact.openedDate || null,
      leagues: [...entry.leagues],
      clubs: entry.clubs,
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from('stadia')
    .select('id, name, slug, city, country, capacity, opened_date, latitude, longitude, wikidata_qid, spurs_women');
  if (existingError) {
    console.error('Could not read existing stadia:', existingError.message);
    process.exit(1);
  }

  const plan = planImport(imported, existing);
  printPlan(plan);

  if (!apply) {
    console.log(`\nDry run - nothing written. Re-run with --apply to write to production.`);
    return;
  }

  for (const update of plan.updates) {
    const { error } = await supabase.from('stadia').update(update.patch).eq('id', update.id);
    if (error) {
      console.error(`Update of ${update.name} failed: ${error.message}`);
      process.exit(1);
    }
  }
  if (plan.inserts.length > 0) {
    const { data: inserted, error } = await supabase.from('stadia').insert(plan.inserts).select('id');
    if (error) {
      console.error(`Insert failed (nothing inserted): ${error.message}`);
      process.exit(1);
    }
    console.log(`\nInserted ${inserted.length} ground(s).`);
  }
  console.log(`Updated ${plan.updates.length} existing ground(s).`);

  await revalidateSiteCache();
}

// Writing straight to Supabase skips the admin UI's cache invalidation, and
// stadium data caches for 24 hours - so revalidate the `stadiums` tag via the
// production /api/cache/revalidate endpoint (same approach as
// scripts/apply-player-stats.js). Never fails the run: the writes have already
// happened, so a revalidation problem only warns.
async function revalidateSiteCache() {
  const tags = ['stadiums'];
  const siteUrl = process.env.SITE_URL || 'https://www.ellieatwhl.co.uk';
  const manualHint = `Revalidate manually: POST ${siteUrl}/api/cache/revalidate with {"tags": ${JSON.stringify(tags)}} (see reference/spurs-women/cache/README.md).`;

  if (!process.env.CACHE_API_KEY) {
    console.warn(`\nWarning: CACHE_API_KEY not set, so the site cache wasn't revalidated. ${manualHint}`);
    return;
  }
  try {
    const res = await fetch(`${siteUrl}/api/cache/revalidate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CACHE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`Revalidated site cache tags: ${tags.join(', ')}`);
  } catch (err) {
    console.warn(`\nWarning: cache revalidation failed (${err.message}). ${manualHint}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
