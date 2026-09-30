// Static game data for Microbrew (One Free Elephant, 2019).
//
// Every table here was checked card by card against the printed card sheets
// (Microbrew Recipes.pdf / Face.pdf / Misc.pdf). Where the old vanilla-JS
// prototype (myPortfolioWebsite, `microbrew` branch) disagreed with the
// printed cards, the cards won - see the notes on RECIPES below.

/** Malt colours, ordered light -> dark. */
export type MaltColour = 'yellow' | 'orange' | 'brown';

/**
 * Everything that can sit in a Copper slot or the shared tin. `hops` only ever
 * means the green hop tokens - it is never a flavour (the prototype's `hops`
 * flavour was a misnaming of `malty`).
 */
export type TokenType = MaltColour | 'hops';

export type Flavour = 'spicy' | 'malty' | 'sweet';

/** Bottle style printed on customer and recipe cards (also the recipe card back). */
export type BeerColour = 'light' | 'medium' | 'dark';

export type Country =
  | 'Belgium'
  | 'Czechia'
  | 'England'
  | 'Germany'
  | 'India'
  | 'Ireland'
  | 'Jamaica'
  | 'Japan'
  | 'Russia'
  | 'Scotland'
  | 'USA';

export type Rating = 'perfect' | 'smooth' | 'rough' | 'muddled';

/** Every recipe, customer drink and bottled beer is exactly four malts. */
export type MaltQuartet = readonly [MaltColour, MaltColour, MaltColour, MaltColour];

export interface Customer {
  id: string;
  name: string;
  country: Country;
  colour: BeerColour;
  drink: MaltQuartet;
  /** Coins printed on the card for serving a beer with this flavour; null if none. */
  flavourBonus: { flavour: Flavour; amount: number } | null;
}

export interface Recipe {
  id: string;
  malts: MaltQuartet;
  payouts: Record<Rating, number>;
  flavours: readonly Flavour[];
  colour: BeerColour;
  /**
   * The card prints its Perfect payout struck through because no customer
   * drinks this combination, so a Perfect rating is unreachable.
   */
  perfectStruckThrough?: boolean;
}

export type ReputationCard =
  | { id: string; type: 'flavour'; flavour: Flavour }
  | { id: string; type: 'regional'; countries: readonly Country[] };

export const MALT_DARKNESS: Record<MaltColour, number> = {
  yellow: 1,
  orange: 2,
  brown: 3,
};

export const TOKEN_COUNTS: Record<TokenType, number> = {
  yellow: 16,
  orange: 16,
  brown: 16,
  hops: 6,
};

/** Hops swapped into each player's Copper during setup (the other 4 go into the tin afterwards). */
export const SETUP_HOPS_PER_PLAYER = 1;

// Copper layout: 16 basic slots as 4 columns of 4 (the 5th "side tank" column
// is unlocked by the Copper Upgrade, WEB-183). Columns are staggered rather
// than a square grid: columns 1 and 3 (indices 0 and 2) sit half a slot higher
// than columns 2 and 4. Adjacency for the Brew puzzle is defined in WEB-180.
export const COPPER_COLUMNS = 4;
export const COPPER_COLUMN_HEIGHT = 4;
export const COPPER_RAISED_COLUMNS: readonly number[] = [0, 2];

export const CUSTOMERS: readonly Customer[] = [
  {
    id: 'jamaican-tropical-stout',
    name: 'Jamaican Tropical Stout',
    country: 'Jamaica',
    colour: 'dark',
    drink: ['yellow', 'brown', 'brown', 'brown'],
    flavourBonus: { flavour: 'sweet', amount: 3 },
  },
  {
    id: 'india-pale-ale',
    name: 'India Pale Ale',
    country: 'India',
    colour: 'light',
    drink: ['yellow', 'yellow', 'yellow', 'orange'],
    flavourBonus: { flavour: 'malty', amount: 2 },
  },
  {
    id: 'munich-dark-lager',
    name: 'Munich Dark Lager',
    country: 'Germany',
    colour: 'medium',
    drink: ['yellow', 'orange', 'orange', 'orange'],
    flavourBonus: { flavour: 'spicy', amount: 2 },
  },
  {
    id: 'tokyo-extra-dry-lager',
    name: 'Tokyo Extra Dry Lager',
    country: 'Japan',
    colour: 'medium',
    drink: ['orange', 'orange', 'orange', 'orange'],
    flavourBonus: null,
  },
  {
    id: 'czech-pilsner',
    name: 'Czech Pilsner',
    country: 'Czechia',
    colour: 'medium',
    drink: ['yellow', 'yellow', 'brown', 'brown'],
    flavourBonus: null,
  },
  {
    id: 'english-milk-stout',
    name: 'English Milk Stout',
    country: 'England',
    colour: 'dark',
    drink: ['brown', 'brown', 'brown', 'brown'],
    flavourBonus: null,
  },
  {
    id: 'russian-imperial-stout',
    name: 'Russian Imperial Stout',
    country: 'Russia',
    colour: 'dark',
    drink: ['orange', 'orange', 'brown', 'brown'],
    flavourBonus: null,
  },
  {
    id: 'belgian-blonde-ale',
    name: 'Belgian Blonde Ale',
    country: 'Belgium',
    colour: 'light',
    drink: ['yellow', 'yellow', 'yellow', 'yellow'],
    flavourBonus: null,
  },
  {
    id: 'american-wheat-ale',
    name: 'American Wheat Ale',
    country: 'USA',
    colour: 'light',
    drink: ['yellow', 'yellow', 'orange', 'orange'],
    flavourBonus: null,
  },
  {
    id: 'scottish-wee-heavy',
    name: 'Scottish Wee Heavy',
    country: 'Scotland',
    colour: 'light',
    drink: ['yellow', 'yellow', 'yellow', 'brown'],
    flavourBonus: { flavour: 'sweet', amount: 3 },
  },
  {
    id: 'oktoberfest-lager',
    name: 'Oktoberfest Lager',
    country: 'Germany',
    colour: 'medium',
    drink: ['orange', 'orange', 'orange', 'brown'],
    flavourBonus: { flavour: 'spicy', amount: 2 },
  },
  {
    id: 'irish-dry-stout',
    name: 'Irish Dry Stout',
    country: 'Ireland',
    colour: 'dark',
    drink: ['orange', 'brown', 'brown', 'brown'],
    flavourBonus: { flavour: 'malty', amount: 2 },
  },
];

// Corrections from the printed cards (the old prototype had these wrong):
//   - orange x4: Perfect $6 / Rough $3 (prototype: $5 / $4)
//   - brown x4 and yellow x4: Perfect $7 (prototype: $6)
//   - yellow/orange/orange/brown: Perfect is struck through on the card (no
//     customer drinks it), so it pays $3 at every achievable tier.
// Duplicate cards have distinct ids so they can be told apart in hands/decks.
export const RECIPES: readonly Recipe[] = [
  {
    id: 'recipe-01',
    malts: ['yellow', 'orange', 'orange', 'brown'],
    payouts: { perfect: 3, smooth: 3, rough: 3, muddled: 3 },
    flavours: ['sweet', 'spicy'],
    colour: 'medium',
    perfectStruckThrough: true,
  },
  {
    id: 'recipe-02',
    malts: ['yellow', 'orange', 'orange', 'orange'],
    payouts: { perfect: 3, smooth: 3, rough: 2, muddled: 1 },
    flavours: ['malty', 'spicy'],
    colour: 'medium',
  },
  {
    id: 'recipe-03',
    malts: ['yellow', 'brown', 'brown', 'brown'],
    payouts: { perfect: 4, smooth: 4, rough: 3, muddled: 1 },
    flavours: ['sweet', 'malty'],
    colour: 'dark',
  },
  {
    id: 'recipe-04',
    malts: ['yellow', 'yellow', 'brown', 'brown'],
    payouts: { perfect: 4, smooth: 4, rough: 3, muddled: 1 },
    flavours: ['spicy'],
    colour: 'medium',
  },
  {
    id: 'recipe-05',
    malts: ['yellow', 'yellow', 'yellow', 'orange'],
    payouts: { perfect: 3, smooth: 3, rough: 2, muddled: 1 },
    flavours: ['sweet', 'malty'],
    colour: 'light',
  },
  {
    id: 'recipe-06',
    malts: ['yellow', 'yellow', 'yellow', 'brown'],
    payouts: { perfect: 4, smooth: 4, rough: 3, muddled: 1 },
    flavours: ['sweet', 'malty'],
    colour: 'light',
  },
  {
    id: 'recipe-07',
    malts: ['yellow', 'yellow', 'orange', 'orange'],
    payouts: { perfect: 4, smooth: 3, rough: 2, muddled: 2 },
    flavours: [],
    colour: 'light',
  },
  {
    id: 'recipe-08',
    malts: ['orange', 'orange', 'brown', 'brown'],
    payouts: { perfect: 4, smooth: 3, rough: 2, muddled: 2 },
    flavours: [],
    colour: 'dark',
  },
  {
    id: 'recipe-09',
    malts: ['orange', 'orange', 'orange', 'brown'],
    payouts: { perfect: 3, smooth: 3, rough: 2, muddled: 1 },
    flavours: ['malty', 'spicy'],
    colour: 'medium',
  },
  {
    id: 'recipe-10',
    malts: ['orange', 'orange', 'orange', 'orange'],
    payouts: { perfect: 6, smooth: 5, rough: 3, muddled: 2 },
    flavours: [],
    colour: 'medium',
  },
  {
    id: 'recipe-11',
    malts: ['orange', 'orange', 'orange', 'orange'],
    payouts: { perfect: 6, smooth: 5, rough: 3, muddled: 2 },
    flavours: [],
    colour: 'medium',
  },
  {
    id: 'recipe-12',
    malts: ['orange', 'brown', 'brown', 'brown'],
    payouts: { perfect: 4, smooth: 3, rough: 2, muddled: 2 },
    flavours: [],
    colour: 'dark',
  },
  {
    id: 'recipe-13',
    malts: ['brown', 'brown', 'brown', 'brown'],
    payouts: { perfect: 7, smooth: 5, rough: 4, muddled: 2 },
    flavours: ['malty'],
    colour: 'dark',
  },
  {
    id: 'recipe-14',
    malts: ['brown', 'brown', 'brown', 'brown'],
    payouts: { perfect: 7, smooth: 5, rough: 4, muddled: 2 },
    flavours: ['malty'],
    colour: 'dark',
  },
  {
    id: 'recipe-15',
    malts: ['yellow', 'yellow', 'yellow', 'yellow'],
    payouts: { perfect: 7, smooth: 5, rough: 4, muddled: 2 },
    flavours: ['spicy'],
    colour: 'light',
  },
  {
    id: 'recipe-16',
    malts: ['yellow', 'yellow', 'yellow', 'yellow'],
    payouts: { perfect: 7, smooth: 5, rough: 4, muddled: 2 },
    flavours: ['spicy'],
    colour: 'light',
  },
];

export const REPUTATION_CARDS: readonly ReputationCard[] = [
  { id: 'reputation-1', type: 'flavour', flavour: 'spicy' },
  { id: 'reputation-2', type: 'flavour', flavour: 'malty' },
  { id: 'reputation-3', type: 'flavour', flavour: 'sweet' },
  { id: 'reputation-4', type: 'regional', countries: ['Jamaica', 'USA'] },
  { id: 'reputation-5', type: 'regional', countries: ['India', 'Russia', 'Japan'] },
  { id: 'reputation-6', type: 'regional', countries: ['England', 'Ireland', 'Scotland'] },
  { id: 'reputation-7', type: 'regional', countries: ['Germany', 'Belgium', 'Czechia'] },
];

/** Reputation setup: 1 shared card revealed, 2 secret cards per player. */
export const PUBLIC_REPUTATION_CARDS = 1;
export const SECRET_REPUTATION_CARDS_PER_PLAYER = 2;

// Physical component counts from the rulebook, beyond the card/token tables
// above. Useful for validating setup/deal logic; not rendered.
export const PLAYER_COUNT = 2;
export const STARTING_BREWERS = 2;
/** The 3rd brewer is unlocked by the Hire Staff action. */
export const MAX_BREWERS = 3;
/** Cash is two cubes on the Copper's cash track (units 0-9, tens 0-40). */
export const STARTING_CASH = 0;
export const MAX_CASH = 49;
export const UPGRADE_TOKENS = 2;
