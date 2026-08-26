import { render, screen, fireEvent } from '@testing-library/react';
import AdminError from '../error';
import { trackError } from '@/lib/fullstory';

jest.mock('@/lib/fullstory', () => ({
  trackError: jest.fn(),
}));

describe('AdminError', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(trackError).mockClear();
  });

  it('renders a friendly message rather than the raw error', () => {
    render(<AdminError error={error} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('calls reset when "Try Again" is clicked', () => {
    const reset = jest.fn();
    render(<AdminError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('links back to the admin dashboard rather than the site homepage', () => {
    render(<AdminError error={error} reset={jest.fn()} />);

    expect(screen.getByRole('link', { name: /back to admin dashboard/i })).toHaveAttribute(
      'href',
      '/spurs-women/admin'
    );
  });

  it('logs the error for local debugging', () => {
    render(<AdminError error={error} reset={jest.fn()} />);

    expect(console.error).toHaveBeenCalledWith('Admin section error:', error);
  });

  it('reports the error to FullStory', () => {
    render(<AdminError error={error} reset={jest.fn()} />);

    expect(trackError).toHaveBeenCalledWith(error, 'spurs-women/admin/error-boundary');
  });
});
