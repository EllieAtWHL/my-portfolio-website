import { render, screen, fireEvent } from '@testing-library/react';
import { GameStart } from '../GameStart';

describe('GameStart', () => {
  it('renders the title, tagline and Play button', () => {
    render(<GameStart />);

    expect(screen.getByRole('heading', { name: 'MICROBREW' })).toBeInTheDocument();
    expect(screen.getByText('A Game of Crafting and Brewing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play game/i })).toBeInTheDocument();
  });

  it('credits the designers and links to the publisher and the physical game', () => {
    render(<GameStart />);

    expect(screen.getByText(/Nigel and Sarah Kennington/)).toBeInTheDocument();
    expect(screen.getByText(/unofficial/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'One Free Elephant' })).toHaveAttribute(
      'href',
      'https://www.onefreeelephant.co.uk/',
    );
    const buyLink = screen.getByRole('link', { name: /buy the physical game/i });
    expect(buyLink).toHaveAttribute('href', 'https://www.onefreeelephant.co.uk/Microbrew/');
    expect(buyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('disables Play, hides the name inputs and shows "Coming soon" when not playable', () => {
    render(<GameStart />);

    expect(screen.getByRole('button', { name: /play game/i })).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('starts the game with the entered player names', () => {
    const onStartGame = jest.fn();
    render(<GameStart onStartGame={onStartGame} />);

    fireEvent.change(screen.getByLabelText("Player One's name"), { target: { value: '  Alice ' } });
    fireEvent.change(screen.getByLabelText("Player Two's name"), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /play game/i }));

    expect(onStartGame).toHaveBeenCalledWith('Alice', 'Bob');
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('falls back to default names when left blank', () => {
    const onStartGame = jest.fn();
    render(<GameStart onStartGame={onStartGame} />);

    fireEvent.change(screen.getByLabelText("Player One's name"), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /play game/i }));

    expect(onStartGame).toHaveBeenCalledWith('Player One', 'Player Two');
  });
});
