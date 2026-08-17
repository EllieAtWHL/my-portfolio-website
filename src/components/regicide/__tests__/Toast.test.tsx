import { act, render, screen } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the message text', () => {
    render(<Toast text="Attacking K of hearts for 10 damage" tone="info" duration={3000} onDismiss={jest.fn()} />);
    expect(screen.getByText('Attacking K of hearts for 10 damage')).toBeInTheDocument();
  });

  it('uses the site\'s green palette for an info toast, not the default Tailwind blue', () => {
    render(<Toast text="Drawing 2 cards from tavern" tone="info" duration={3000} onDismiss={jest.fn()} />);
    const toast = screen.getByRole('button');
    expect(toast).toHaveClass('bg-[var(--bg-light-1)]', 'dark:bg-[var(--dark-bg-1)]');
    expect(toast.className).not.toContain('blue');
  });

  it('uses a solid red for an error toast', () => {
    render(<Toast text="Illegal move" tone="error" duration={3000} onDismiss={jest.fn()} />);
    const toast = screen.getByRole('button');
    expect(toast).toHaveClass('bg-red-600', 'text-white');
  });

  it('auto-dismisses after the given duration', () => {
    const onDismiss = jest.fn();
    render(<Toast text="Illegal move" tone="error" duration={3000} onDismiss={onDismiss} />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses early when clicked, without waiting for the full duration', () => {
    const onDismiss = jest.fn();
    render(<Toast text="Illegal move" tone="error" duration={3000} onDismiss={onDismiss} />);

    act(() => {
      screen.getByRole('button').click();
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
