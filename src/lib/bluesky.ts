export interface BlueskyPostRef {
  // Either a handle (e.g. ellieatwhl.co.uk) or a DID (did:plc:...) - bsky.app
  // post URLs use whichever the link was copied with.
  profile: string;
  postId: string;
}

// Bluesky post URLs are https://bsky.app/profile/{handle-or-did}/post/{postId}
export function parseBlueskyPostUrl(url: string): BlueskyPostRef | null {
  const match = url.match(/profile\/([^/?#]+)\/post\/([a-z0-9]+)/i);
  return match ? { profile: decodeURIComponent(match[1]), postId: match[2] } : null;
}

// Resolves a handle to its DID via Bluesky's public, unauthenticated AppView
// (no API key needed). A profile segment that's already a DID is returned as-is.
export async function resolveBlueskyDid(profile: string): Promise<string | null> {
  if (profile.startsWith('did:')) return profile;

  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(profile)}`
    );

    if (!response.ok) {
      console.error('Failed to resolve Bluesky handle:', profile, response.statusText);
      return null;
    }

    const data = await response.json();
    return typeof data?.did === 'string' ? data.did : null;
  } catch (error) {
    console.error('Error resolving Bluesky handle:', profile, error);
    return null;
  }
}

// The at:// URI Bluesky's embed.js expects in data-bluesky-uri
export async function getBlueskyEmbedUri(url: string): Promise<string | null> {
  const ref = parseBlueskyPostUrl(url);
  if (!ref) {
    console.error('Invalid Bluesky post URL:', url);
    return null;
  }

  const did = await resolveBlueskyDid(ref.profile);
  return did ? `at://${did}/app.bsky.feed.post/${ref.postId}` : null;
}
