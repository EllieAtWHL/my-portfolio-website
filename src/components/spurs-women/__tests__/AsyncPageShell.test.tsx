import { render, screen, fireEvent } from '@testing-library/react';
import AsyncPageShell from '../AsyncPageShell';

const defaultProps = {
  loading: false,
  hasError: false,
  onRetry: jest.fn(),
  loadingLabel: 'widgets',
  heading: 'All Widgets',
  errorMessage: "Couldn't load widgets. Please try again.",
};

describe('AsyncPageShell', () => {
  beforeEach(() => {
    (defaultProps.onRetry as jest.Mock).mockReset();
  });

  it('shows a loading message built from loadingLabel, and renders neither the heading nor children', () => {
    render(
      <AsyncPageShell {...defaultProps} loading={true}>
        <p>Success content</p>
      </AsyncPageShell>
    );

    expect(screen.getByText('Loading widgets...')).toBeInTheDocument();
    expect(screen.queryByText('All Widgets')).not.toBeInTheDocument();
    expect(screen.queryByText('Success content')).not.toBeInTheDocument();
  });

  it('shows the heading and an ErrorState with the given message on error, not children', () => {
    render(
      <AsyncPageShell {...defaultProps} hasError={true}>
        <p>Success content</p>
      </AsyncPageShell>
    );

    expect(screen.getByRole('heading', { name: 'All Widgets' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load widgets. Please try again.");
    expect(screen.queryByText('Success content')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading widgets...')).not.toBeInTheDocument();
  });

  it('calls onRetry when the error state\'s retry button is clicked', () => {
    render(
      <AsyncPageShell {...defaultProps} hasError={true}>
        <p>Success content</p>
      </AsyncPageShell>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders children, not loading or error UI, once loaded successfully', () => {
    render(
      <AsyncPageShell {...defaultProps}>
        <p>Success content</p>
      </AsyncPageShell>
    );

    expect(screen.getByText('Success content')).toBeInTheDocument();
    expect(screen.queryByText('Loading widgets...')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('wraps content in the shared main#main-content / max-w-6xl layout', () => {
    const { container } = render(
      <AsyncPageShell {...defaultProps}>
        <p>Success content</p>
      </AsyncPageShell>
    );

    const main = container.querySelector('main#main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('p-8', 'pb-footer-clearance');
    expect(main?.querySelector('.max-w-6xl.mx-auto')).toContainElement(screen.getByText('Success content'));
  });
});
