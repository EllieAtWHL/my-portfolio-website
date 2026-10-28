import { getBlueskyEmbedUri, parseBlueskyPostUrl, resolveBlueskyDid } from '../bluesky';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body,
  } as Response;
}

describe('parseBlueskyPostUrl', () => {
  it('extracts a handle profile and post id', () => {
    expect(parseBlueskyPostUrl('https://bsky.app/profile/spurswomen.bsky.social/post/3abc123')).toEqual({
      profile: 'spurswomen.bsky.social',
      postId: '3abc123',
    });
  });

  it('extracts a DID profile and post id', () => {
    expect(parseBlueskyPostUrl('https://bsky.app/profile/did:plc:abc123/post/3xyz?ref=share')).toEqual({
      profile: 'did:plc:abc123',
      postId: '3xyz',
    });
  });

  it.each(['https://bsky.app/profile/someone', 'https://bsky.app/post/3abc', 'not a url'])(
    'returns null for %s',
    (url) => {
      expect(parseBlueskyPostUrl(url)).toBeNull();
    }
  );
});

describe('resolveBlueskyDid', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes a DID straight through without fetching', async () => {
    await expect(resolveBlueskyDid('did:plc:abc123')).resolves.toBe('did:plc:abc123');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resolves a handle via the public AppView', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ did: 'did:plc:resolved' }));

    await expect(resolveBlueskyDid('someone.bsky.social')).resolves.toBe('did:plc:resolved');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=someone.bsky.social'
    );
  });

  it('returns null when the handle cannot be resolved', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ error: 'InvalidRequest' }, false));

    await expect(resolveBlueskyDid('deleted.bsky.social')).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('returns null when the response has no DID', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}));

    await expect(resolveBlueskyDid('someone.bsky.social')).resolves.toBeNull();
  });

  it('returns null on a network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(resolveBlueskyDid('someone.bsky.social')).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('getBlueskyEmbedUri', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ did: 'did:plc:resolved' }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds the at:// URI against the post author's DID", async () => {
    await expect(
      getBlueskyEmbedUri('https://bsky.app/profile/someone.bsky.social/post/3abc')
    ).resolves.toBe('at://did:plc:resolved/app.bsky.feed.post/3abc');
  });

  it('returns null and logs for an invalid post URL', async () => {
    await expect(getBlueskyEmbedUri('https://bsky.app/profile/someone')).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
