import { render, screen } from '@testing-library/react';
import { YouTubeEmbed } from '../YouTubeEmbed';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('YouTubeEmbed', () => {
  it('derives the embed URL from the video ID once embedded content is allowed', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => true, isConsentKnown: true });

    render(<YouTubeEmbed videoId="abc123" />);

    expect(screen.getByTitle('YouTube video player')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abc123'
    );
  });

  it('derives the fallback watch link from the same video ID until then', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: true });

    render(<YouTubeEmbed videoId="abc123" />);

    expect(screen.queryByTitle('YouTube video player')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Watch this video on YouTube' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abc123'
    );
  });
});
