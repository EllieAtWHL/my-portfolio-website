import { render, screen, fireEvent } from '@testing-library/react';
import RegicideGame from '../RegicideGame';

describe('RegicideGame - rules reference', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('opens the rules from the start screen, via both the rules icon and the Learn to Play card', () => {
    render(<RegicideGame />);

    fireEvent.click(screen.getByRole('button', { name: 'How to play' }));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close rules' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Learn to Play'));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
  });

  it('opens the rules mid-game without disturbing the game in progress', () => {
    render(<RegicideGame />);
    fireEvent.click(screen.getByRole('button', { name: /play game/i }));

    // Choose a card, so there's in-progress turn state to lose
    const [firstHandCard] = screen.getAllByRole('button', { name: / of / });
    fireEvent.click(firstHandCard);
    expect(screen.getByText(/Attack Power:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'How to play' }));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Attack Power:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use jester/i })).toBeDisabled();
  });
});
