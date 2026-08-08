import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

function TestDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div ref={containerRef}>
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when it opens', () => {
    render(<TestDialog isOpen onClose={jest.fn()} />);

    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Tab from the last element back to the first', () => {
    render(<TestDialog isOpen onClose={jest.fn()} />);

    screen.getByText('Last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Shift+Tab from the first element back to the last', () => {
    render(<TestDialog isOpen onClose={jest.fn()} />);

    expect(screen.getByText('First')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(screen.getByText('Last')).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(<TestDialog isOpen onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the triggering element on close', () => {
    function Wrapper() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button onClick={() => setIsOpen(true)}>Trigger</button>
          <TestDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
      );
    }

    render(<Wrapper />);
    const trigger = screen.getByText('Trigger');
    // jsdom's fireEvent.click doesn't simulate the browser's default
    // focus-on-click for buttons, so focus it explicitly first to mirror
    // real usage (a keyboard/mouse activation focuses the trigger).
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByText('First')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveFocus();
  });
});
