import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from '../GameControls';

const baseProps = {
  phase: 'attack' as const,
  onAttack: jest.fn(),
  canAttack: false,
  onUseJester: jest.fn(),
  jestersRemaining: 2,
  canUseJester: true,
  onUndo: jest.fn(),
  canUndo: false,
};

describe('GameControls', () => {
  it('uses a Jester when allowed', () => {
    const onUseJester = jest.fn();
    render(<GameControls {...baseProps} onUseJester={onUseJester} />);

    const jester = screen.getByRole('button', { name: /use jester \(2\)/i });
    expect(jester).toBeEnabled();
    expect(jester).not.toHaveAttribute('title');
    fireEvent.click(jester);
    expect(onUseJester).toHaveBeenCalledTimes(1);
  });

  it('disables the Jester mid-turn and explains why', () => {
    render(<GameControls {...baseProps} canUseJester={false} />);

    const jester = screen.getByRole('button', { name: /use jester/i });
    expect(jester).toBeDisabled();
    expect(jester).toHaveAttribute('title', expect.stringMatching(/before you choose a card/));
  });

  it('disables the Jester without a timing explanation once none remain', () => {
    render(<GameControls {...baseProps} jestersRemaining={0} canUseJester={false} />);

    const jester = screen.getByRole('button', { name: /use jester \(0\)/i });
    expect(jester).toBeDisabled();
    expect(jester).not.toHaveAttribute('title');
  });

  it('hides Attack during the defend phase', () => {
    render(<GameControls {...baseProps} phase="defend" />);

    expect(screen.queryByRole('button', { name: /attack/i })).not.toBeInTheDocument();
  });
});
