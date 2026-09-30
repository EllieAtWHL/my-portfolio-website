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

  it('runs setup through the recipe return and both hop swaps', () => {
    startFixtureGame();

    fireEvent.click(screen.getByRole('button', { name: "Show Bob's hand" }));
    fireEvent.click(screen.getAllByRole('button', { name: /return this recipe/i })[1]);

    expect(screen.getByText(/Alice, pick a malt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /column 2, slot 2 from the bottom/i }));

    expect(screen.getByText(/Bob, pick a malt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /column 3, slot 2 from the bottom/i }));

    expect(screen.getByRole('heading', { name: 'Setup complete' })).toBeInTheDocument();
    expect(screen.getByText(/Alice goes first/)).toBeInTheDocument();
    expect(screen.getByText(/Tin: 22 tokens/)).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /: hops$/ })).toHaveLength(2);
  });

  it('returns to the start screen on New game', () => {
    startFixtureGame();

    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.getByRole('heading', { name: 'MICROBREW' })).toBeInTheDocument();
  });
});
