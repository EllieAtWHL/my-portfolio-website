import { render, screen } from '@testing-library/react';
import { ToastContainer } from '../ToastContainer';
import type { ToastItem } from '@/hooks/useToasts';

jest.mock('../Toast', () => ({
  Toast: ({ text, onDismiss }: { text: string; onDismiss: () => void }) => (
    <button type="button" onClick={onDismiss}>
      {text}
    </button>
  ),
}));

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stacks every active toast, not just the most recent one', () => {
    const toasts: ToastItem[] = [
      { id: 1, text: 'Attacking K of hearts for 10 damage', tone: 'info', duration: 3000 },
      { id: 2, text: 'K of hearts is attacking for 15', tone: 'info', duration: 3000 },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={jest.fn()} />);

    expect(screen.getByText('Attacking K of hearts for 10 damage')).toBeInTheDocument();
    expect(screen.getByText('K of hearts is attacking for 15')).toBeInTheDocument();
  });

  it('dismisses the toast matching the id that was clicked', () => {
    const onDismiss = jest.fn();
    const toasts: ToastItem[] = [
      { id: 1, text: 'first', tone: 'info', duration: 3000 },
      { id: 2, text: 'second', tone: 'info', duration: 3000 },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    screen.getByText('second').click();

    expect(onDismiss).toHaveBeenCalledWith(2);
  });
});
