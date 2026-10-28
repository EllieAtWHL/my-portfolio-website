const {
  parseStadiumTable,
  cleanStadiumName,
  slugify,
  inBritishIsles,
  parseWktPoint,
  wikidataDate,
  currentSeason,
  placeFromAddress,
  planImport,
} = require('../lib/groundhopper-stadium-import');

// Shaped like the real 2026–27 Premier League "Stadiums and locations" table:
// one cell per line, style attributes, refs and efn templates in cells.
const PREMIER_LEAGUE_TABLE = `===Stadiums and locations===
{{location map+ |England |places= {{location map~ |England |lat=51.5 |long=-0.1 |label=[[Football in London|London]]}} }}
{| class="wikitable sortable"
! Team
! Location
! Stadium
! Capacity
|-
| [[Arsenal F.C.|Arsenal]]
| [[London]] {{small|([[Holloway, London|Holloway]])}}
| [[Emirates Stadium]]
| style="text-align:center;" |60,704
|-
| [[Aston Villa F.C.|Aston Villa]]
| [[Birmingham]]
| [[Villa Park]]
| style="text-align: center;" |36,887{{efn|Reduced for redevelopment.<ref>{{Cite web |title=North Stand}}</ref>}}
|-
| [[Brentford F.C.|Brentford]]
| London {{small|([[Brentford]])}}
| [[Brentford Community Stadium]]
| style="text-align: center;" |17,250
|}`;

// Shaped like the WSL table: header and cells on one line with !! and ||,
// a piped stadium link, and a ref after the stadium link.
const WSL_TABLE = `==Teams==
{| class="wikitable sortable"
|-
! Team !! Location !! Ground !! Capacity !! 2025–26 season
|-
| [[Birmingham City W.F.C.|Birmingham City]]|| [[Birmingham]] {{small|([[Bordesley, Birmingham|Bordesley]])}} || [[St Andrew's (stadium)|St Andrew's]] || style="text-align:center"| 29,902 || 1st
|-
| [[Brighton & Hove Albion W.F.C.|Brighton & Hove Albion]] || [[Crawley]] || [[Broadfield Stadium]]<ref group="lower-alpha">Four matches at [[Falmer Stadium]].</ref> || 6,134 || 7th
|-
| Placeholder FC || Nowhere || To be confirmed || - || -
|}`;

// Shaped like the Scottish Premiership table: unquoted scope= attributes,
// row-header (!) club cells, no location column, and a File: column.
const SCOTTISH_TABLE = `{|class="wikitable sortable" style="text-align:center"
|-
!scope=column|Team
!scope=column|Stadium
!scope=column|Capacity
!scope=column|Photo

|-
!scope=row|[[Aberdeen F.C.|Aberdeen]]
|[[Pittodrie Stadium]]
|19,274<ref>{{#invoke:cite|web|url=http://spfl.co.uk/clubs/aberdeen/ |title=Aberdeen}}</ref>
|[[File:Pittodrie from Block Y, May 2015.jpg|200px]]
|-
!scope=row|[[Celtic F.C.|Celtic]]
|[[Celtic Park]]
|60,411
|[[File:Celtic Park.jpg|200px]]
|}`;

describe('parseStadiumTable', () => {
  it('reads one-cell-per-line tables, ignoring refs, efn notes and style attributes', () => {
    expect(parseStadiumTable(PREMIER_LEAGUE_TABLE)).toEqual([
      { club: 'Arsenal', city: 'London', stadiumTitle: 'Emirates Stadium' },
      { club: 'Aston Villa', city: 'Birmingham', stadiumTitle: 'Villa Park' },
      { club: 'Brentford', city: 'London', stadiumTitle: 'Brentford Community Stadium' },
    ]);
  });

  it('reads single-line tables, finds a "Ground" column, and skips rows with no stadium link', () => {
    expect(parseStadiumTable(WSL_TABLE)).toEqual([
      { club: 'Birmingham City', city: 'Birmingham', stadiumTitle: "St Andrew's (stadium)" },
      { club: 'Brighton & Hove Albion', city: 'Crawley', stadiumTitle: 'Broadfield Stadium' },
    ]);
  });

  it('reads row-header club cells and tables with no location column', () => {
    expect(parseStadiumTable(SCOTTISH_TABLE)).toEqual([
      { club: 'Aberdeen', city: null, stadiumTitle: 'Pittodrie Stadium' },
      { club: 'Celtic', city: null, stadiumTitle: 'Celtic Park' },
    ]);
  });

  it('returns nothing when there is no table', () => {
    expect(parseStadiumTable('No table here')).toEqual([]);
  });
});

describe('cleanStadiumName / slugify', () => {
  it('drops Wikipedia disambiguators', () => {
    expect(cleanStadiumName("St Andrew's (stadium)")).toBe("St Andrew's");
    expect(cleanStadiumName('Memorial Stadium (Bristol)')).toBe('Memorial Stadium');
    expect(cleanStadiumName('Villa Park')).toBe('Villa Park');
  });

  it('makes URL-safe slugs', () => {
    expect(slugify("St Andrew's")).toBe('st-andrews');
    expect(slugify('Estadio Jesús Navas')).toBe('estadio-jesus-navas');
    expect(slugify('Brighton & Hove')).toBe('brighton-and-hove');
  });
});

describe('coordinate and date helpers', () => {
  it('parses WKT points (longitude first)', () => {
    expect(parseWktPoint('Point(-0.1083 51.555)')).toEqual({ latitude: 51.555, longitude: -0.1083 });
    expect(parseWktPoint(undefined)).toBeNull();
  });

  it('bounds-checks Britain', () => {
    expect(inBritishIsles(51.5, -0.1)).toBe(true);
    expect(inBritishIsles(57.15, -2.09)).toBe(true); // Aberdeen
    expect(inBritishIsles(50.95, -50.95)).toBe(false); // the WEB-220 Ten Acres error
    expect(inBritishIsles(0, 0)).toBe(false);
  });

  it('turns Wikidata dates into column values, partial dates on the 1st', () => {
    expect(wikidataDate('+1892-08-24T00:00:00Z', 11)).toBe('1892-08-24');
    expect(wikidataDate('+2013-01-00T00:00:00Z', 10)).toBe('2013-01-01');
    expect(wikidataDate('+1887-00-00T00:00:00Z', 9)).toBe('1887-01-01');
    expect(wikidataDate(undefined, 11)).toBeNull();
  });

  it('reads town and UK country from an OpenStreetMap address', () => {
    expect(placeFromAddress({ town: 'Kilmarnock', county: 'East Ayrshire', state: 'Scotland' })).toEqual({ city: 'Kilmarnock', country: 'Scotland' });
    expect(placeFromAddress({ city: 'Wrexham', state: 'Cymru / Wales' })).toEqual({ city: 'Wrexham', country: 'Wales' });
    expect(placeFromAddress({ city: 'Aberdeen City', state: 'Alba / Scotland' })).toEqual({ city: 'Aberdeen', country: 'Scotland' });
    expect(placeFromAddress({ city: 'City of Edinburgh', state: 'Alba / Scotland' })).toEqual({ city: 'Edinburgh', country: 'Scotland' });
    expect(placeFromAddress({ village: 'Somewhere', state: 'Île-de-France' })).toEqual({ city: 'Somewhere', country: null });
    expect(placeFromAddress(undefined)).toEqual({ city: null, country: null });
  });

  it('picks the season that is running', () => {
    expect(currentSeason(new Date('2026-10-28T00:00:00Z'))).toBe('2026–27');
    expect(currentSeason(new Date('2027-03-01T00:00:00Z'))).toBe('2026–27');
    expect(currentSeason(new Date('2027-07-01T00:00:00Z'))).toBe('2027–28');
  });
});

describe('planImport', () => {
  const ground = (overrides) => ({
    qid: 'Q1',
    name: 'Somewhere Park',
    city: 'Somewhere',
    country: 'England',
    latitude: 52,
    longitude: -1,
    capacity: 10000,
    openedDate: '1900-01-01',
    leagues: ['League Two'],
    ...overrides,
  });
  const existingRow = (overrides) => ({
    id: 'existing-1',
    name: 'Existing Ground',
    slug: 'existing-ground',
    city: 'London',
    country: 'England',
    capacity: 5000,
    opened_date: '1950-01-01',
    latitude: 51.5,
    longitude: -0.1,
    wikidata_qid: null,
    spurs_women: true,
    ...overrides,
  });

  it('inserts new grounds as Groundhopper-only, with their Wikidata ID', () => {
    const { inserts, updates } = planImport([ground()], [existingRow()]);

    expect(updates).toEqual([]);
    expect(inserts).toEqual([
      {
        name: 'Somewhere Park',
        slug: 'somewhere-park',
        city: 'Somewhere',
        country: 'England',
        capacity: 10000,
        opened_date: '1900-01-01',
        latitude: 52,
        longitude: -1,
        spurs_women: false,
        wikidata_qid: 'Q1',
      },
    ]);
  });

  it('links a nearby existing ground instead of duplicating it, filling only blanks', () => {
    const existing = existingRow({ capacity: null, opened_date: '1950-01-01' });
    const nearby = ground({ latitude: 51.5005, longitude: -0.1, capacity: 60000, openedDate: '2006-07-22' });

    const { inserts, updates } = planImport([nearby], [existing]);

    expect(inserts).toEqual([]);
    expect(updates).toEqual([
      expect.objectContaining({
        id: 'existing-1',
        patch: { wikidata_qid: 'Q1', capacity: 60000 }, // opened_date already set - not overwritten
      }),
    ]);
    // Never touches spurs_women, name, city or coordinates that are already there.
    expect(Object.keys(updates[0].patch)).not.toContain('spurs_women');
  });

  it('matches by wikidata_qid on re-runs, even if the coordinates moved', () => {
    const existing = existingRow({ wikidata_qid: 'Q1', latitude: 40, longitude: 10 });

    const result = planImport([ground()], [existing]);

    expect(result.inserts).toEqual([]);
    expect(result.updates).toEqual([]);
    expect(result.unchanged).toEqual([expect.objectContaining({ id: 'existing-1', matchedBy: 'wikidata_qid' })]);
  });

  it('gives two nearby imported grounds to the closest existing row only', () => {
    // Like Dundee's two grounds, ~200 m apart.
    const existing = existingRow({ latitude: 56.4748, longitude: -2.9733 });
    const densPark = ground({ qid: 'Q10', name: 'Dens Park', latitude: 56.4748, longitude: -2.9733 });
    const tannadice = ground({ qid: 'Q11', name: 'Tannadice Park', latitude: 56.4744, longitude: -2.9693 });

    const { inserts, updates } = planImport([tannadice, densPark], [existing]);

    // Both are within 0.5 km, but the existing row is Dens Park's (0 m), so it
    // goes to Dens Park even though Tannadice is listed first.
    expect(updates.map((u) => u.ground.name)).toEqual(['Dens Park']);
    expect(inserts.map((i) => i.name)).toEqual(['Tannadice Park']);
  });

  it('skips grounds with no coordinates, bad coordinates or no Wikidata ID', () => {
    const { inserts, skipped } = planImport(
      [
        ground({ qid: 'Q2', latitude: undefined, longitude: undefined }),
        ground({ qid: 'Q3', latitude: 50.95, longitude: -50.95 }),
        ground({ qid: 'http://www.wikidata.org/entity/Q4' }),
      ],
      []
    );

    expect(inserts).toEqual([]);
    expect(skipped.map((s) => s.reason)).toEqual([
      'no coordinates on Wikidata',
      'coordinates outside Britain (50.95, -50.95)',
      'no valid Wikidata ID (http://www.wikidata.org/entity/Q4)',
    ]);
  });

  it('makes slugs unique against existing rows and each other', () => {
    const { inserts } = planImport(
      [
        ground({ qid: 'Q5', name: 'Existing Ground', city: 'Leeds', latitude: 53.8, longitude: -1.5 }),
        ground({ qid: 'Q6', name: 'Memorial Stadium', city: 'Bristol', latitude: 51.48, longitude: -2.58 }),
        ground({ qid: 'Q7', name: 'Memorial Stadium', city: 'Bristol', latitude: 52.2, longitude: -0.2 }),
      ],
      [existingRow()]
    );

    expect(inserts.map((i) => i.slug)).toEqual(['existing-ground-leeds', 'memorial-stadium', 'memorial-stadium-bristol']);
  });
});
