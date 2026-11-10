import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from '../GameControls';

const baseProps = {
  phase: 'attack' as const,
  onAttack: jest.fn(),
  canAttack: false,
  onUseJester: jest.fn(),
  jestersRemaining: 2,
  onUndo: jest.fn(),
  canUndo: false,
};

describe('GameControls', () => {
  it('uses a Jester while any remain', () => {
    const onUseJester = jest.fn();
    render(<GameControls {...baseProps} onUseJester={onUseJester} />);

    const jester = screen.getByRole('button', { name: /use jester \(2\)/i });
    expect(jester).toBeEnabled();
    fireEvent.click(jester);
    expect(onUseJester).toHaveBeenCalledTimes(1);
  });

  it('disables the Jester once none remain', () => {
    render(<GameControls {...baseProps} jestersRemaining={0} />);

    expect(screen.getByRole('button', { name: /use jester \(0\)/i })).toBeDisabled();
  });

  it('hides Attack during the defend phase', () => {
    render(<GameControls {...baseProps} phase="defend" />);

    expect(screen.queryByRole('button', { name: /attack/i })).not.toBeInTheDocument();
  });
});
