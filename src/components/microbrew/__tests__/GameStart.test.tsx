import { render, screen, fireEvent } from '@testing-library/react';
import { GameStart } from '../GameStart';
import MicrobrewGame from '../../MicrobrewGame';

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

  it('disables Play and shows "Coming soon" until a start handler is provided', () => {
    render(<GameStart />);

    expect(screen.getByRole('button', { name: /play game/i })).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('calls onStartGame when Play is clicked', () => {
    const onStartGame = jest.fn();
    render(<GameStart onStartGame={onStartGame} />);

    fireEvent.click(screen.getByRole('button', { name: /play game/i }));
    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });
});

describe('MicrobrewGame', () => {
  it('starts on the GameStart screen', () => {
    render(<MicrobrewGame />);
    expect(screen.getByRole('heading', { name: 'MICROBREW' })).toBeInTheDocument();
  });
});
