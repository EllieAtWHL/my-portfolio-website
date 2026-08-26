import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

jest.mock('@/lib/fullstory', () => ({
  trackError: jest.fn(),
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  // Errors thrown by Bomb are expected here and would otherwise spam the test's
  // console output via React's own error logging.
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders the default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.queryByText('Safe content')).not.toBeInTheDocument();
  });

  it('renders a custom static fallback', () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('renders a custom render-prop fallback with the error and a reset handle', () => {
    render(
      <ErrorBoundary fallback={(error, reset) => (
        <div>
          <p>Failed: {error.message}</p>
          <button onClick={reset}>Reset</button>
        </div>
      )}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Failed: boom')).toBeInTheDocument();
  });

  it('recovers when reset is triggered and the child no longer throws', () => {
    function Wrapper() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary
          fallback={(_error: Error, reset: () => void) => (
            <button
              onClick={() => {
                setShouldThrow(false);
                reset();
              }}
            >
              Recover
            </button>
          )}
        >
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Wrapper />);

    fireEvent.click(screen.getByText('Recover'));

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
