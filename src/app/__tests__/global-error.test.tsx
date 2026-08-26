import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../global-error';
import { trackError } from '@/lib/fullstory';

jest.mock('@/lib/fullstory', () => ({
  trackError: jest.fn(),
}));

// global-error.tsx renders its own <html>/<body> (it replaces the root layout
// entirely), so it can't use next/script's real client-side behaviour in JSDOM.
jest.mock('next/script', () => {
  return function MockScript() { return null; };
});

describe('GlobalError', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(trackError).mockClear();
  });

  it('renders a friendly message rather than the raw error', () => {
    render(<GlobalError error={error} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('calls reset when "Try Again" is clicked', () => {
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('logs the error for local debugging', () => {
    render(<GlobalError error={error} reset={jest.fn()} />);

    expect(console.error).toHaveBeenCalledWith('Root layout error:', error);
  });

  it('reports the error to FullStory', () => {
    render(<GlobalError error={error} reset={jest.fn()} />);

    expect(trackError).toHaveBeenCalledWith(error, 'root/global-error-boundary');
  });
});
