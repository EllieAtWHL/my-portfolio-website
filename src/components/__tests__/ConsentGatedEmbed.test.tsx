import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentGatedEmbed, EmbedConsentFallback } from '../ConsentGatedEmbed';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;
const VIDEO_URL = 'https://www.youtube.com/watch?v=abc123';

function renderGate() {
  return render(
    <ConsentGatedEmbed service="YouTube" href={VIDEO_URL} linkLabel="Watch this video on YouTube">
      <iframe title="YouTube video player" src="https://www.youtube.com/embed/abc123" />
    </ConsentGatedEmbed>
  );
}

describe('ConsentGatedEmbed', () => {
  it('renders nothing until the stored consent choice has been read', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: false });

    const { container } = renderGate();

    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['nothing is allowed', () => false],
    ['every other category is allowed', (category: string) => category !== 'embeds'],
  ])('shows the fallback link instead of the iframe when %s', (_label, hasConsent) => {
    mockUseCookieConsent.mockReturnValue({ hasConsent, isConsentKnown: true, openPreferences: jest.fn() });

    renderGate();

    expect(screen.queryByTitle('YouTube video player')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Watch this video on YouTube' })).toHaveAttribute(
      'href',
      VIDEO_URL
    );
    expect(
      screen.getByText('YouTube sets cookies, so this only shows here once you allow "Embedded content" cookies.')
    ).toBeInTheDocument();
  });

  it('renders the embed once embedded content is allowed', () => {
    mockUseCookieConsent.mockReturnValue({
      hasConsent: (category: string) => category === 'embeds',
      isConsentKnown: true,
    });

    renderGate();

    expect(screen.getByTitle('YouTube video player')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Watch this video on YouTube' })).not.toBeInTheDocument();
  });
});

describe('EmbedConsentFallback', () => {
  it('reopens the cookie banner from its Cookie preferences button', () => {
    const openPreferences = jest.fn();
    mockUseCookieConsent.mockReturnValue({ openPreferences });

    render(<EmbedConsentFallback service="Spotify" href="https://open.spotify.com/track/x" linkLabel="Listen" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cookie preferences' }));

    expect(openPreferences).toHaveBeenCalled();
  });

  it('opens the link in a new tab, with main-site styling by default', () => {
    mockUseCookieConsent.mockReturnValue({ openPreferences: jest.fn() });

    render(<EmbedConsentFallback service="Spotify" href="https://open.spotify.com/track/x" linkLabel="Listen" />);

    const link = screen.getByRole('link', { name: 'Listen' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveClass('spurs-text');
    expect(screen.getByRole('button', { name: 'Cookie preferences' })).toHaveClass('secondary');
  });

  it('uses spurs link and button styling with theme="spurs"', () => {
    mockUseCookieConsent.mockReturnValue({ openPreferences: jest.fn() });

    render(
      <EmbedConsentFallback
        service="Instagram"
        href="https://www.instagram.com/p/x/"
        linkLabel="View this post on Instagram"
        theme="spurs"
      />
    );

    expect(screen.getByRole('link', { name: 'View this post on Instagram' })).toHaveClass(
      'spurs-text',
      'venue-link'
    );
    expect(screen.getByRole('button', { name: 'Cookie preferences' })).toHaveClass('spurs-button');
  });
});
