import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverModal } from '../GameOverModal';

describe('GameOverModal', () => {
  it.each([
    ['gold', 'Gold victory'],
    ['silver', 'Silver victory'],
    ['bronze', 'Bronze victory'],
  ] as const)('shows the %s medal on a win', (medal, label) => {
    render(<GameOverModal victory medal={medal} onRestart={jest.fn()} onShowStats={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'You won the game!' })).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows no medal on a loss', () => {
    render(<GameOverModal victory={false} medal="bronze" onRestart={jest.fn()} onShowStats={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Sorry, you lost' })).toBeInTheDocument();
    expect(screen.queryByText(/victory/i)).not.toBeInTheDocument();
  });

  it('offers Play Again and View Stats', () => {
    const onRestart = jest.fn();
    const onShowStats = jest.fn();
    render(<GameOverModal victory medal="gold" onRestart={onRestart} onShowStats={onShowStats} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    fireEvent.click(screen.getByRole('button', { name: 'View Stats' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onShowStats).toHaveBeenCalledTimes(1);
  });
});
