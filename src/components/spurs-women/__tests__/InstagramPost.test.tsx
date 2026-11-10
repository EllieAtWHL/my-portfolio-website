import { render, screen } from '@testing-library/react';
import InstagramPost from '../InstagramPost';
import { useCookieConsent } from '../../CookieConsentProvider';

jest.mock('../../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;
const POST_URL = 'https://www.instagram.com/p/C1abcDEF/';
const ALLOWED = { hasConsent: (category: string) => category === 'embeds', isConsentKnown: true };
const DECLINED = { hasConsent: (category: string) => category !== 'embeds', isConsentKnown: true };

describe('InstagramPost', () => {
  afterEach(() => {
    delete window.instgrm;
    document.querySelectorAll('script').forEach((script) => script.remove());
  });

  it.each([
    ['nothing is allowed', () => false],
    ['every other category is allowed', DECLINED.hasConsent],
  ])(
    'shows a plain link and loads no Instagram script when %s',
    (_label, hasConsent) => {
      mockUseCookieConsent.mockReturnValue({ hasConsent, isConsentKnown: true });

      const { container } = render(<InstagramPost url={POST_URL} />);

      expect(screen.getByRole('link', { name: 'View this post on Instagram' })).toHaveAttribute(
        'href',
        POST_URL
      );
      expect(screen.getByText(/Instagram sets cookies, so this only shows here once you allow "Embedded content" cookies/)).toBeInTheDocument();
      expect(container.querySelector('blockquote')).not.toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    }
  );

  it('renders nothing until the stored consent choice has been read', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: false });

    const { container } = render(<InstagramPost url={POST_URL} />);

    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('removes the embed when consent is withdrawn', () => {
    mockUseCookieConsent.mockReturnValue(ALLOWED);
    const { container, rerender } = render(<InstagramPost url={POST_URL} />);
    // Stand-in for the iframe Meta's script swaps in outside React's control
    container.querySelector('blockquote')?.replaceWith(document.createElement('iframe'));

    mockUseCookieConsent.mockReturnValue(DECLINED);
    rerender(<InstagramPost url={POST_URL} />);

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View this post on Instagram' })).toBeInTheDocument();
  });

  it('injects the embed blockquote and script once embedded content is allowed', () => {
    mockUseCookieConsent.mockReturnValue(ALLOWED);

    const { container } = render(<InstagramPost url={POST_URL} />);

    const blockquote = container.querySelector('blockquote.instagram-media');
    expect(blockquote).toHaveAttribute('data-instgrm-permalink', POST_URL);
    expect(blockquote?.querySelector('a')).toHaveAttribute('href', POST_URL);
    expect(blockquote?.querySelector('a')).toHaveClass('spurs-text', 'venue-link');
    expect(document.querySelector('script')).toHaveAttribute(
      'src',
      'https://www.instagram.com/embed.js'
    );
  });

  it('re-scans with the already-loaded script instead of loading it again', () => {
    mockUseCookieConsent.mockReturnValue(ALLOWED);
    const process = jest.fn();
    window.instgrm = { Embeds: { process } };

    const { container } = render(<InstagramPost url={POST_URL} />);

    expect(container.querySelector('blockquote.instagram-media')).toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('loads the script only once for several posts on the same page', () => {
    mockUseCookieConsent.mockReturnValue(ALLOWED);

    render(
      <>
        <InstagramPost url={POST_URL} />
        <InstagramPost url="https://www.instagram.com/p/Other123/" />
      </>
    );

    expect(document.querySelectorAll('blockquote.instagram-media')).toHaveLength(2);
    expect(document.querySelectorAll('script')).toHaveLength(1);
  });

  it('replaces the previous embed when the URL changes', () => {
    mockUseCookieConsent.mockReturnValue(ALLOWED);

    const { container, rerender } = render(<InstagramPost url={POST_URL} />);
    rerender(<InstagramPost url="https://www.instagram.com/p/Other123/" />);

    const blockquotes = container.querySelectorAll('blockquote');
    expect(blockquotes).toHaveLength(1);
    expect(blockquotes[0]).toHaveAttribute(
      'data-instgrm-permalink',
      'https://www.instagram.com/p/Other123/'
    );
  });
});
