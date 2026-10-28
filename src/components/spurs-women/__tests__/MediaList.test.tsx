import { render, screen } from '@testing-library/react';
import MediaList from '../MediaList';
import type { Media } from '@/types/media';

jest.mock('../BlueskyPost', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => <div data-testid="bluesky-post" data-url={url} />,
}));

jest.mock('../InstagramPost', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => <div data-testid="instagram-post" data-url={url} />,
}));

const media = (id: number, type: Media['type'], url: string, title: string | null = null): Media => ({
  id,
  type,
  url,
  caption: null,
  title,
});

describe('MediaList', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<MediaList items={[]} title="Media" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dispatches social media posts to the matching embed by URL', () => {
    render(
      <MediaList
        title="Media"
        items={[
          media(1, 'social media', 'https://bsky.app/profile/someone/post/3abc'),
          media(2, 'social media', 'https://www.instagram.com/p/C1abc/'),
        ]}
      />
    );

    expect(screen.getByTestId('bluesky-post')).toHaveAttribute(
      'data-url',
      'https://bsky.app/profile/someone/post/3abc'
    );
    expect(screen.getByTestId('instagram-post')).toHaveAttribute(
      'data-url',
      'https://www.instagram.com/p/C1abc/'
    );
  });

  it('falls back to a plain link for social media on an unsupported host', () => {
    render(
      <MediaList title="Media" items={[media(1, 'social media', 'https://x.com/someone/status/1')]} />
    );

    expect(screen.queryByTestId('bluesky-post')).not.toBeInTheDocument();
    expect(screen.queryByTestId('instagram-post')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://x.com/someone/status/1' })).toHaveAttribute(
      'href',
      'https://x.com/someone/status/1'
    );
  });

  it('renders non-social media as links, using the title when present', () => {
    render(
      <MediaList
        title="Media"
        items={[
          media(1, 'article', 'https://example.com/report', 'Match report'),
          media(2, 'article', 'https://example.com/untitled', '  '),
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Match report' })).toHaveAttribute(
      'href',
      'https://example.com/report'
    );
    expect(screen.getByRole('link', { name: 'https://example.com/untitled' })).toBeInTheDocument();
  });
});
