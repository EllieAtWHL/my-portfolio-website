import { CUSTOMERS, RECIPES, REPUTATION_CARDS, TOKEN_COUNTS, MALT_DARKNESS, type Flavour } from '../data';

// Structural checks only - the values themselves were transcribed card by card
// against the printed sheets, so re-asserting every payout here would just be
// a second copy of the table. The spot checks below pin the specific places
// the old prototype was wrong, so a regression back to its values fails loudly.

const FLAVOURS: Flavour[] = ['spicy', 'malty', 'sweet'];

describe('Microbrew static data', () => {
  it('has the rulebook component counts', () => {
    expect(CUSTOMERS).toHaveLength(12);
    expect(RECIPES).toHaveLength(16);
    expect(REPUTATION_CARDS).toHaveLength(7);
    expect(TOKEN_COUNTS).toEqual({ yellow: 16, orange: 16, brown: 16, hops: 6 });
  });

  it('orders malts light to dark', () => {
    expect(MALT_DARKNESS.yellow).toBeLessThan(MALT_DARKNESS.orange);
    expect(MALT_DARKNESS.orange).toBeLessThan(MALT_DARKNESS.brown);
  });

  it('gives every card a unique id, including duplicate recipe cards', () => {
    const ids = [...CUSTOMERS, ...RECIPES, ...REPUTATION_CARDS].map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only ever uses spicy/malty/sweet as flavours (never hops)', () => {
    const used = [
      ...CUSTOMERS.flatMap((c) => (c.flavourBonus ? [c.flavourBonus.flavour] : [])),
      ...RECIPES.flatMap((r) => r.flavours),
      ...REPUTATION_CARDS.flatMap((r) => (r.type === 'flavour' ? [r.flavour] : [])),
    ];
    for (const flavour of used) {
      expect(FLAVOURS).toContain(flavour);
    }
  });

  it('never pays more for a worse rating', () => {
    for (const { payouts } of RECIPES) {
      expect(payouts.perfect).toBeGreaterThanOrEqual(payouts.smooth);
      expect(payouts.smooth).toBeGreaterThanOrEqual(payouts.rough);
      expect(payouts.rough).toBeGreaterThanOrEqual(payouts.muddled);
    }
  });

  it('uses the printed-card payouts where the prototype was wrong', () => {
    const payoutsFor = (malt: string) =>
      RECIPES.filter((r) => r.malts.every((m) => m === malt)).map((r) => r.payouts);

    for (const payouts of payoutsFor('orange')) {
      expect(payouts).toEqual({ perfect: 6, smooth: 5, rough: 3, muddled: 2 });
    }
    for (const payouts of [...payoutsFor('brown'), ...payoutsFor('yellow')]) {
      expect(payouts.perfect).toBe(7);
    }
  });

  it('marks Perfect as struck through only where no customer drinks the recipe', () => {
    const key = (malts: readonly string[]) => malts.join(',');
    const drinks = new Set(CUSTOMERS.map((c) => key(c.drink)));

    for (const recipe of RECIPES) {
      expect(Boolean(recipe.perfectStruckThrough)).toBe(!drinks.has(key(recipe.malts)));
    }
  });

  it('only references countries that some customer comes from', () => {
    const countries = new Set(CUSTOMERS.map((c) => c.country));
    for (const card of REPUTATION_CARDS) {
      if (card.type === 'regional') {
        for (const country of card.countries) {
          expect(countries).toContain(country);
        }
      }
    }
  });
});
