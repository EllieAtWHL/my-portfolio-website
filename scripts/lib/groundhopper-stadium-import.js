/**
 * Pure helpers for scripts/import-groundhopper-stadiums.js (WEB-222) - no
 * network or database access here, so they can be unit tested directly (see
 * scripts/__tests__/groundhopper-stadium-import.test.js).
 *
 * Pipeline: a league season's Wikipedia article says which grounds are in use
 * this season (parseStadiumTable), Wikidata supplies each ground's facts
 * (coordinates, capacity, opening date), and planImport decides, per ground,
 * whether it's new or already in `stadia` - never overwriting existing data.
 */

const LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/;

function stripRefs(text) {
  return text
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

// Drops {{templates}}, innermost first, so nested ones go too.
function stripTemplates(text) {
  let previous;
  let current = text;
  do {
    previous = current;
    current = current.replace(/\{\{[^{}]*\}\}/g, '');
  } while (current !== previous);
  return current;
}

function firstLink(cell) {
  const match = LINK.exec(cell);
  if (!match) return null;
  const target = match[1].trim();
  return { target, text: (match[2] || target).trim() };
}

// "London {{small|([[Holloway, London|Holloway]])}}" -> "London";
// "[[Falmer]]" -> "Falmer".
function cellText(cell) {
  const withoutTemplates = stripTemplates(cell);
  const link = firstLink(withoutTemplates);
  if (link) return link.text;
  return withoutTemplates.replace(/'''?/g, '').trim();
}

// Removes a cell's leading attributes, quoted or not:
// 'style="text-align:center" | 60,704', 'scope=row|[[Aberdeen F.C.|Aberdeen]]'.
function cellValue(raw) {
  return raw.replace(/^\s*(?:[a-z-]+=(?:"[^"]*"|[^\s|"[]+)\s*)+\|(?!\|)/i, '').trim();
}

/**
 * Parses the first wikitable in a season article's "Stadiums and locations"
 * (or "Teams") section into { club, city, stadiumTitle } rows. Finds the
 * stadium and location columns by header text, so column order doesn't
 * matter. Rows whose stadium cell has no link are skipped - every current
 * league ground has a Wikipedia article, and the link is what ties the row
 * to a Wikidata item.
 */
function parseStadiumTable(wikitext) {
  const start = wikitext.indexOf('{|');
  if (start === -1) return [];
  const end = wikitext.indexOf('\n|}', start);
  const table = stripRefs(wikitext.slice(start, end === -1 ? undefined : end));

  let header = null;
  const rows = [];
  for (const block of table.split(/\n\|-[^\n]*/)) {
    const lines = block.split('\n').filter((line) => line.trim() && !line.startsWith('{|') && !line.startsWith('|+'));
    if (lines.length === 0) continue;
    const joined = lines.join('\n');

    // The first !-row is the header; later ones are data rows whose first
    // cell is a row header ("!scope=row|[[Aberdeen F.C.|Aberdeen]]").
    if (!header && lines[0].startsWith('!')) {
      header = joined
        .split(/!!|\n!/)
        .map((cell) => cellValue(cell.replace(/^!/, '')).toLowerCase());
      continue;
    }
    if (!header) continue;

    const cells = joined.split(/\|\||!!|\n\||\n!/).map((cell) => cellValue(cell.replace(/^[|!]/, '')));
    const stadiumIndex = header.findIndex((h) => /stadium|ground|venue/.test(h));
    // Word boundaries: "capacity" contains "city".
    const locationIndex = header.findIndex((h) => /\b(?:location|city|town)\b/.test(h));
    const teamIndex = Math.max(0, header.findIndex((h) => /team|club/.test(h)));
    if (stadiumIndex === -1 || cells.length <= stadiumIndex) continue;

    const stadium = firstLink(stripTemplates(cells[stadiumIndex]));
    if (!stadium) continue;
    rows.push({
      club: cellText(cells[teamIndex] || ''),
      city: locationIndex === -1 ? null : cellText(cells[locationIndex] || '') || null,
      stadiumTitle: stadium.target,
    });
  }
  return rows;
}

// "St Andrew's (stadium)" -> "St Andrew's"; "Memorial Stadium (Bristol)" ->
// "Memorial Stadium". The disambiguator is Wikipedia's, not the ground's name.
function cleanStadiumName(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function distanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Great Britain plus Northern Ireland, padded. Anything outside is a data
// error for these leagues (the WEB-220 kind: a longitude copied from the
// latitude, a ground in the Atlantic).
function inBritishIsles(latitude, longitude) {
  return latitude >= 49.8 && latitude <= 61 && longitude >= -8.7 && longitude <= 2;
}

// "Point(-0.1083 51.555)" (WKT, longitude first) -> { latitude, longitude }.
function parseWktPoint(wkt) {
  const match = /Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i.exec(wkt || '');
  return match ? { latitude: Number(match[2]), longitude: Number(match[1]) } : null;
}

// Wikidata time ("+1892-08-24T00:00:00Z") + precision (9 = year, 10 = month,
// 11 = day) -> a date column value. Partial dates are stored as the 1st,
// matching the existing rows (the site only ever shows the year).
function wikidataDate(time, precision) {
  const match = /^\+?(\d{4})-(\d{2})-(\d{2})/.exec(time || '');
  if (!match) return null;
  const [, year, month, day] = match;
  if (Number(precision) <= 9) return `${year}-01-01`;
  if (Number(precision) === 10) return `${year}-${month}-01`;
  return `${year}-${month}-${day}`;
}

// OpenStreetMap reverse-geocode address -> { city, country }, for grounds whose
// league table has no location column (the Scottish Premiership's) or whose
// Wikidata item has no "located in" chain to a UK country. OSM's `state` is
// the UK country, bilingual for Wales and Scotland ("Cymru / Wales",
// "Alba / Scotland"), and its `city` is sometimes the council name
// ("Aberdeen City", "City of Edinburgh").
const UK_COUNTRIES = ['England', 'Wales', 'Scotland', 'Northern Ireland'];
function placeFromAddress(address = {}) {
  const town = address.city || address.town || address.village || address.suburb || null;
  const stateNames = (address.state || '').split(' / ');
  return {
    city: town ? town.replace(/^City of /, '').replace(/ City$/, '') : null,
    country: UK_COUNTRIES.find((country) => stateNames.includes(country)) || null,
  };
}

// The season whose article to read: seasons start in July/August, so from
// July onwards it's "<year>–<year+1>", before that the one that started last year.
function currentSeason(date = new Date()) {
  const year = date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${year}–${String((year + 1) % 100).padStart(2, '0')}`;
}

// Existing grounds within this distance of an imported one are treated as the
// same ground. Pairs are assigned closest-first (see planImport), so two
// neighbouring grounds - Dundee's are ~200 m apart - can't steal each other's row.
const MATCH_RADIUS_KM = 0.5;

function validate(ground) {
  if (!/^Q[1-9]\d*$/.test(ground.qid || '')) return `no valid Wikidata ID (${ground.qid || 'none'})`;
  if (!Number.isFinite(ground.latitude) || !Number.isFinite(ground.longitude)) return 'no coordinates on Wikidata';
  if (!inBritishIsles(ground.latitude, ground.longitude)) {
    return `coordinates outside Britain (${ground.latitude}, ${ground.longitude})`;
  }
  return null;
}

// Imported index -> { row, matchedBy }. Wikidata ID matches first; then every
// imported/existing pair within MATCH_RADIUS_KM, closest first, each side used once.
function matchExisting(grounds, existing) {
  const matches = new Map();
  const claimed = new Set();
  const byQid = new Map(existing.filter((row) => row.wikidata_qid).map((row) => [row.wikidata_qid, row]));

  grounds.forEach((ground, index) => {
    const row = byQid.get(ground.qid);
    if (row) {
      matches.set(index, { row, matchedBy: 'wikidata_qid' });
      claimed.add(row.id);
    }
  });

  const unlinked = existing.filter((row) => !row.wikidata_qid && row.latitude != null && row.longitude != null);
  const pairs = [];
  grounds.forEach((ground, index) => {
    if (matches.has(index)) return;
    for (const row of unlinked) {
      const km = distanceKm(ground, { latitude: Number(row.latitude), longitude: Number(row.longitude) });
      if (km <= MATCH_RADIUS_KM) pairs.push({ index, row, km });
    }
  });
  pairs.sort((a, b) => a.km - b.km);
  for (const { index, row, km } of pairs) {
    if (matches.has(index) || claimed.has(row.id)) continue;
    matches.set(index, { row, matchedBy: `${Math.round(km * 1000)} m away` });
    claimed.add(row.id);
  }
  return matches;
}

/**
 * Decides what to write. `imported` are grounds from Wikipedia + Wikidata:
 * { qid, name, city, country, latitude, longitude, capacity, openedDate, leagues }.
 * `existing` are current `stadia` rows.
 *
 * - An existing row with the same wikidata_qid, or failing that the closest
 *   unlinked row within MATCH_RADIUS_KM, is the same ground: it gets its
 *   wikidata_qid set and any *blank* facts filled - nothing is overwritten,
 *   and spurs_women is never touched.
 * - Anything else is inserted with spurs_women = false and a unique slug.
 * - Grounds without usable coordinates, or outside Britain, are skipped with
 *   a reason, never written.
 */
function planImport(imported, existing) {
  const inserts = [];
  const updates = [];
  const skipped = [];
  const unchanged = [];
  const slugs = new Set(existing.map((row) => row.slug));

  const valid = [];
  for (const ground of imported) {
    const reason = validate(ground);
    if (reason) skipped.push({ ground, reason });
    else valid.push(ground);
  }
  const matches = matchExisting(valid, existing);

  valid.forEach((ground, index) => {
    const found = matches.get(index);
    if (found) {
      const { row: match, matchedBy } = found;
      const patch = {};
      if (!match.wikidata_qid) patch.wikidata_qid = ground.qid;
      if (match.capacity == null && ground.capacity) patch.capacity = ground.capacity;
      if (match.opened_date == null && ground.openedDate) patch.opened_date = ground.openedDate;
      if (match.country == null && ground.country) patch.country = ground.country;
      if (match.city == null && ground.city) patch.city = ground.city;
      if (match.latitude == null) {
        patch.latitude = ground.latitude;
        patch.longitude = ground.longitude;
      }
      if (Object.keys(patch).length > 0) {
        updates.push({ id: match.id, name: match.name, ground, matchedBy, patch });
      } else {
        unchanged.push({ id: match.id, name: match.name, ground, matchedBy });
      }
      return;
    }

    let slug = slugify(ground.name);
    if (slugs.has(slug) && ground.city) slug = slugify(`${ground.name} ${ground.city}`);
    for (let n = 2; slugs.has(slug); n++) slug = `${slugify(ground.name)}-${n}`;
    slugs.add(slug);

    inserts.push({
      name: ground.name,
      slug,
      city: ground.city || null,
      country: ground.country || null,
      capacity: ground.capacity || null,
      opened_date: ground.openedDate || null,
      latitude: Number(ground.latitude.toFixed(6)),
      longitude: Number(ground.longitude.toFixed(6)),
      spurs_women: false,
      wikidata_qid: ground.qid,
    });
  });

  return { inserts, updates, unchanged, skipped };
}

module.exports = {
  parseStadiumTable,
  cleanStadiumName,
  slugify,
  distanceKm,
  inBritishIsles,
  parseWktPoint,
  wikidataDate,
  currentSeason,
  placeFromAddress,
  planImport,
  MATCH_RADIUS_KM,
};
