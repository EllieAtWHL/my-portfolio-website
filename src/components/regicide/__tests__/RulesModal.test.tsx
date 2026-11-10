import { render, screen, fireEvent, within } from '@testing-library/react';
import { RulesModal, OFFICIAL_RULES_URL } from '../RulesModal';
import { HAND_LIMIT, ROYAL_STATS, SET_LIMITS, TOTAL_JESTERS } from '@/hooks/useRegicideGame';

describe('RulesModal', () => {
  it('renders as a labelled modal dialog', () => {
    render(<RulesModal onClose={jest.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'How to play' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('opens with only the first section expanded', () => {
    render(<RulesModal onClose={jest.fn()} />);

    const sections = screen.getByRole('dialog').querySelectorAll('details');
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0]).toHaveAttribute('open');
    Array.from(sections)
      .slice(1)
      .forEach((section) => expect(section).not.toHaveAttribute('open'));
  });

  // The modal's numbers come from the engine's constants, so these assert
  // against those same constants - if the engine's rules change, the rules
  // text changes with them.
  it("lists every same-number combo the engine allows, including pairs of 5s", () => {
    render(<RulesModal onClose={jest.fn()} />);

    Object.entries(SET_LIMITS).forEach(([rank, limit]) => {
      expect(screen.getByText(`Up to ${limit} × ${rank}s (total ${limit! * Number(rank)})`)).toBeInTheDocument();
    });
    expect(screen.getByText('Up to 2 × 5s (total 10)')).toBeInTheDocument();
  });

  it("shows each royal's attack and health from the engine", () => {
    render(<RulesModal onClose={jest.fn()} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      `Jack${ROYAL_STATS.J.attack}${ROYAL_STATS.J.health}`,
      `Queen${ROYAL_STATS.Q.attack}${ROYAL_STATS.Q.health}`,
      `King${ROYAL_STATS.K.attack}${ROYAL_STATS.K.health}`,
    ]);
  });

  it('describes the hand size, Jester count and every medal', () => {
    render(<RulesModal onClose={jest.fn()} />);

    expect(
      screen.getByText(`You start with a hand of ${HAND_LIMIT} cards and ${TOTAL_JESTERS} Jesters set to one side.`)
    ).toBeInTheDocument();
    expect(screen.getByText('Gold').parentElement).toHaveTextContent('Gold - no Jesters used');
    expect(screen.getByText('Silver').parentElement).toHaveTextContent('Silver - 1 Jester used');
    expect(screen.getByText('Bronze').parentElement).toHaveTextContent('Bronze - 2 Jesters used');
  });

  it('links to the official rulebook in a new tab', () => {
    render(<RulesModal onClose={jest.fn()} />);

    const link = screen.getByRole('link', { name: /regicide rulebook/i });
    expect(link).toHaveAttribute('href', OFFICIAL_RULES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('closes via the close button, Escape, or a backdrop click - but not a click inside the dialog', () => {
    const onClose = jest.fn();
    render(<RulesModal onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close rules' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('locks page scrolling while open and restores it on close', () => {
    const { unmount } = render(<RulesModal onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
});
