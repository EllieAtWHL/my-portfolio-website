import { render, screen, act } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';

function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('OfflineBanner', () => {
  afterEach(() => {
    setOnLine(true);
  });

  it('renders nothing when the browser is online', () => {
    setOnLine(true);

    render(<OfflineBanner />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a message when the browser starts offline', () => {
    setOnLine(false);

    render(<OfflineBanner />);

    expect(screen.getByRole('status')).toHaveTextContent("You're offline");
  });

  it('shows the banner when an offline event fires', () => {
    setOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    setOnLine(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('hides the banner when an online event fires', () => {
    setOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    setOnLine(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
