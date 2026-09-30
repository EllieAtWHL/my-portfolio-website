import { render, screen, fireEvent, within } from '@testing-library/react';
import MicrobrewGame from '../MicrobrewGame';

// Drives the placeholder setup UI end to end against the deterministic shuffle
// fixture documented in src/lib/microbrew/__tests__/game.test.ts
// (Math.random pinned to 0: player one goes first, player two holds
// recipe-03 (dark) + recipe-07 (light) and must return one).

function startFixtureGame() {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  render(<MicrobrewGame playable />);
  fireEvent.change(screen.getByLabelText("Player One's name"), { target: { value: 'Alice' } });
  fireEvent.change(screen.getByLabelText("Player Two's name"), { target: { value: 'Bob' } });
  fireEvent.click(screen.getByRole('button', { name: /play game/i }));
}

describe('MicrobrewGame', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows "Coming soon" and cannot be started when not playable', () => {
    render(<MicrobrewGame playable={false} />);

    expect(screen.getByRole('button', { name: /play game/i })).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('keeps the second player’s hand hidden until they ask to see it', () => {
    startFixtureGame();

    expect(screen.getByText(/Alice, look away/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /return this recipe/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "Show Bob's hand" }));
    expect(screen.getAllByRole('button', { name: /return this recipe/i })).toHaveLength(2);
  });

  it('shows each player’s recipe backs (colour tiers) publicly', () => {
    startFixtureGame();

    const bob = screen.getByRole('region', { name: "Bob's brewery" });
    expect(within(bob).getByText('Recipe backs:').parentElement).toHaveTextContent(/dark\s*light/);
  });

  /** Plays both setup choices; afterwards Alice's hop is at column 2, slot 2 (1-indexed). */
  function completeFixtureSetup() {
    startFixtureGame();
    fireEvent.click(screen.getByRole('button', { name: "Show Bob's hand" }));
    fireEvent.click(screen.getAllByRole('button', { name: /return this recipe/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /column 2, slot 2 from the bottom/i }));
    fireEvent.click(screen.getByRole('button', { name: /column 3, slot 2 from the bottom/i }));
  }

  const aliceSlot = (label: RegExp) =>
    within(screen.getByRole('region', { name: "Alice's brewery" })).getByRole('button', {
      name: new RegExp(label.source, 'i'),
    });

  it('runs setup through the recipe return and both hop swaps', () => {
    startFixtureGame();

    fireEvent.click(screen.getByRole('button', { name: "Show Bob's hand" }));
    fireEvent.click(screen.getAllByRole('button', { name: /return this recipe/i })[1]);

    expect(screen.getByText(/Alice, pick a malt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /column 2, slot 2 from the bottom/i }));

    expect(screen.getByText(/Bob, pick a malt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /column 3, slot 2 from the bottom/i }));

    expect(screen.getByRole('heading', { name: "Alice's turn" })).toBeInTheDocument();
    expect(screen.getByText(/Tin: 22 tokens/)).toBeInTheDocument();
    // Alice's Copper is now the interactive board (buttons); Bob's is read-only (images).
    expect(aliceSlot(/column 2, slot 2 from the bottom: hops$/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /column 3, slot 2 from the bottom: hops$/i })).toBeInTheDocument();
  });

  it('brews: pick a token, swap it along a line, keep going, then end the brew', () => {
    completeFixtureSetup();

    // A yellow whose only neighbour is another yellow can't be picked.
    expect(aliceSlot(/column 1, slot 4 from the bottom/i)).toBeDisabled();

    fireEvent.click(aliceSlot(/column 2, slot 2 from the bottom: hops$/));
    expect(screen.getByText(/pick a highlighted neighbour/)).toBeInTheDocument();
    expect(aliceSlot(/column 2, slot 2 from the bottom/i)).toHaveAttribute('aria-pressed', 'true');

    // A hop can swap with any of its 4 diagonal neighbours.
    fireEvent.click(aliceSlot(/column 1, slot 1 from the bottom/i));
    expect(screen.getByText(/Alice is brewing: 1 swap so far/)).toBeInTheDocument();
    expect(aliceSlot(/column 1, slot 1 from the bottom: hops$/)).toHaveAttribute('aria-pressed', 'true');
    expect(aliceSlot(/column 2, slot 2 from the bottom: light malt$/)).toBeInTheDocument();

    // Mid-chain, other tokens can't be picked - only the moving hop's targets.
    expect(aliceSlot(/column 4, slot 4 from the bottom/i)).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'End brew' }));
    expect(screen.getByRole('status')).toHaveTextContent('Brew finished.');
    expect(screen.queryByRole('button', { name: 'End brew' })).not.toBeInTheDocument();
  });

  it('lets the player cancel or change their pick before the first swap', () => {
    completeFixtureSetup();

    fireEvent.click(aliceSlot(/column 2, slot 2 from the bottom: hops$/));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(aliceSlot(/column 2, slot 2 from the bottom/i)).toHaveAttribute('aria-pressed', 'false');

    // Picking the same token again un-picks it.
    fireEvent.click(aliceSlot(/column 2, slot 2 from the bottom: hops$/));
    fireEvent.click(aliceSlot(/column 2, slot 2 from the bottom: hops$/));
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('returns to the start screen on New game', () => {
    startFixtureGame();

    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.getByRole('heading', { name: 'MICROBREW' })).toBeInTheDocument();
  });
});
