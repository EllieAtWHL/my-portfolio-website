import { render, waitFor } from '@testing-library/react';
import BlueskyPost from '../BlueskyPost';
import { getBlueskyEmbedUri } from '@/lib/bluesky';

jest.mock('@/lib/bluesky', () => ({
  getBlueskyEmbedUri: jest.fn(),
}));

const mockGetBlueskyEmbedUri = getBlueskyEmbedUri as jest.Mock;

describe('BlueskyPost', () => {
  beforeEach(() => {
    mockGetBlueskyEmbedUri.mockReset();
  });

  afterEach(() => {
    delete window.bluesky;
    document.querySelectorAll('script').forEach((script) => script.remove());
  });

  it("injects the embed blockquote and script for the post author's URI", async () => {
    mockGetBlueskyEmbedUri.mockResolvedValue('at://did:plc:someone/app.bsky.feed.post/3abc');

    const { container } = render(
      <BlueskyPost url="https://bsky.app/profile/someone.bsky.social/post/3abc" />
    );

    await waitFor(() => {
      expect(container.querySelector('blockquote.bluesky-embed')).toHaveAttribute(
        'data-bluesky-uri',
        'at://did:plc:someone/app.bsky.feed.post/3abc'
      );
    });
    expect(document.querySelector('script')).toHaveAttribute(
      'src',
      'https://embed.bsky.app/static/embed.js'
    );
  });

  it('re-scans with the already-loaded script instead of loading it again', async () => {
    mockGetBlueskyEmbedUri.mockResolvedValue('at://did:plc:someone/app.bsky.feed.post/3abc');
    const scan = jest.fn();
    window.bluesky = { scan };

    const { container } = render(<BlueskyPost url="https://bsky.app/profile/someone/post/3abc" />);

    await waitFor(() => expect(scan).toHaveBeenCalledTimes(1));
    expect(container.querySelector('blockquote.bluesky-embed')).toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('loads the script only once for several posts on the same page', async () => {
    mockGetBlueskyEmbedUri
      .mockResolvedValueOnce('at://did:plc:a/app.bsky.feed.post/1')
      .mockResolvedValueOnce('at://did:plc:b/app.bsky.feed.post/2');

    render(
      <>
        <BlueskyPost url="https://bsky.app/profile/a/post/1" />
        <BlueskyPost url="https://bsky.app/profile/b/post/2" />
      </>
    );

    await waitFor(() => {
      expect(document.querySelectorAll('blockquote.bluesky-embed')).toHaveLength(2);
    });
    expect(document.querySelectorAll('script')).toHaveLength(1);
  });

  it('renders nothing when the URI cannot be resolved', async () => {
    mockGetBlueskyEmbedUri.mockResolvedValue(null);

    const { container } = render(<BlueskyPost url="https://bsky.app/profile/gone/post/3abc" />);

    await waitFor(() => expect(mockGetBlueskyEmbedUri).toHaveBeenCalled());
    expect(container.querySelector('blockquote')).not.toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('replaces the previous embed when the URL changes, ignoring a stale lookup', async () => {
    let resolveFirst: (uri: string) => void = () => {};
    mockGetBlueskyEmbedUri
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce('at://did:plc:second/app.bsky.feed.post/2');

    const { container, rerender } = render(<BlueskyPost url="https://bsky.app/profile/a/post/1" />);
    rerender(<BlueskyPost url="https://bsky.app/profile/b/post/2" />);

    await waitFor(() => {
      expect(container.querySelectorAll('blockquote')).toHaveLength(1);
    });
    resolveFirst('at://did:plc:first/app.bsky.feed.post/1');
    await Promise.resolve();

    const blockquotes = container.querySelectorAll('blockquote');
    expect(blockquotes).toHaveLength(1);
    expect(blockquotes[0]).toHaveAttribute('data-bluesky-uri', 'at://did:plc:second/app.bsky.feed.post/2');
  });
});
