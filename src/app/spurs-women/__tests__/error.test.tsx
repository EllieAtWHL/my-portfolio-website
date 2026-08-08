import { render, screen, fireEvent } from '@testing-library/react';
import SpursWomenError from '../error';

describe('SpursWomenError', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a friendly message rather than the raw error', () => {
    render(<SpursWomenError error={error} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('calls reset when "Try Again" is clicked', () => {
    const reset = jest.fn();
    render(<SpursWomenError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('links back to the Spurs Women homepage', () => {
    render(<SpursWomenError error={error} reset={jest.fn()} />);

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'href',
      '/spurs-women'
    );
  });

  it('logs the error for local debugging', () => {
    render(<SpursWomenError error={error} reset={jest.fn()} />);

    expect(console.error).toHaveBeenCalledWith('Spurs Women section error:', error);
  });
});
