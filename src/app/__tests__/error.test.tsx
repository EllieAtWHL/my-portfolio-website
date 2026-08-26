import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../error';
import { trackError } from '@/lib/fullstory';

jest.mock('@/lib/fullstory', () => ({
  trackError: jest.fn(),
}));

jest.mock('@/components/MainSitePage', () => {
  return function MockMainSitePage({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

describe('Error (core site)', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(trackError).mockClear();
  });

  it('renders a friendly message rather than the raw error', () => {
    render(<ErrorPage error={error} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('calls reset when "Try Again" is clicked', () => {
    const reset = jest.fn();
    render(<ErrorPage error={error} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('links back to the site homepage', () => {
    render(<ErrorPage error={error} reset={jest.fn()} />);

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  it('logs the error for local debugging', () => {
    render(<ErrorPage error={error} reset={jest.fn()} />);

    expect(console.error).toHaveBeenCalledWith('Site error:', error);
  });

  it('reports the error to FullStory', () => {
    render(<ErrorPage error={error} reset={jest.fn()} />);

    expect(trackError).toHaveBeenCalledWith(error, 'root/error-boundary');
  });
});
