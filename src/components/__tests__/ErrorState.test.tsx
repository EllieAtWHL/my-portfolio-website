import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders a default message with an alert role', () => {
    render(<ErrorState />);

    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this content. Please try again.");
  });

  it('renders a custom message', () => {
    render(<ErrorState message="Couldn't load matches. Please try again." />);

    expect(screen.getByText("Couldn't load matches. Please try again.")).toBeInTheDocument();
  });

  it('does not render a retry button when onRetry is omitted', () => {
    render(<ErrorState />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
