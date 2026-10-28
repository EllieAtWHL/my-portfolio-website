import { render, screen } from '@testing-library/react';
import InstagramPost from '../InstagramPost';
import { useCookieConsent } from '../../CookieConsentProvider';

jest.mock('../../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;
const POST_URL = 'https://www.instagram.com/p/C1abcDEF/';

describe('InstagramPost', () => {
  afterEach(() => {
    delete window.instgrm;
    document.querySelectorAll('script').forEach((script) => script.remove());
  });

  it.each(['rejected', null] as const)(
    'shows a plain link and loads no Instagram script when consent is %s',
    (consent) => {
      mockUseCookieConsent.mockReturnValue({ consent, isConsentKnown: true });

      const { container } = render(<InstagramPost url={POST_URL} />);

      expect(screen.getByRole('link', { name: 'View this post on Instagram' })).toHaveAttribute(
        'href',
        POST_URL
      );
      expect(screen.getByText(/only shows here once you accept cookies/)).toBeInTheDocument();
      expect(container.querySelector('blockquote')).not.toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    }
  );

  it('renders nothing until the stored consent choice has been read', () => {
    mockUseCookieConsent.mockReturnValue({ consent: null, isConsentKnown: false });

    const { container } = render(<InstagramPost url={POST_URL} />);

    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('removes the embed when consent is withdrawn', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted', isConsentKnown: true });
    const { container, rerender } = render(<InstagramPost url={POST_URL} />);
    // Stand-in for the iframe Meta's script swaps in outside React's control
    container.querySelector('blockquote')?.replaceWith(document.createElement('iframe'));

    mockUseCookieConsent.mockReturnValue({ consent: 'rejected', isConsentKnown: true });
    rerender(<InstagramPost url={POST_URL} />);

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View this post on Instagram' })).toBeInTheDocument();
  });

  it('injects the embed blockquote and script once consent is accepted', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted', isConsentKnown: true });

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
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted', isConsentKnown: true });
    const process = jest.fn();
    window.instgrm = { Embeds: { process } };

    const { container } = render(<InstagramPost url={POST_URL} />);

    expect(container.querySelector('blockquote.instagram-media')).toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('loads the script only once for several posts on the same page', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted', isConsentKnown: true });

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
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted', isConsentKnown: true });

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
