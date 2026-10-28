export interface BlueskyPostRef {
  // Either a handle (e.g. ellieatwhl.co.uk) or a DID (did:plc:...) - bsky.app
  // post URLs use whichever the link was copied with.
  profile: string;
  postId: string;
}

// Bluesky post URLs are https://bsky.app/profile/{handle-or-did}/post/{postId}
export function parseBlueskyPostUrl(url: string): BlueskyPostRef | null {
  const match = url.match(/profile\/([^/?#]+)\/post\/([a-z0-9]+)/i);
  if (!match) return null;
  try {
    return { profile: decodeURIComponent(match[1]), postId: match[2] };
  } catch {
    // Malformed percent-encoding in the profile segment
    return null;
  }
}

// A match page often has several posts from the same account, so concurrent
// and repeat lookups of one handle share a single request. Failures are
// dropped from the cache so a network blip doesn't stick for the whole session.
const didLookups = new Map<string, Promise<string | null>>();

// Resolves a handle to its DID via Bluesky's public, unauthenticated AppView
// (no API key needed). A profile segment that's already a DID is returned as-is.
export function resolveBlueskyDid(profile: string): Promise<string | null> {
  if (profile.startsWith('did:')) return Promise.resolve(profile);

  const handle = profile.toLowerCase();
  let lookup = didLookups.get(handle);
  if (!lookup) {
    lookup = fetchDid(handle).then((did) => {
      if (!did) didLookups.delete(handle);
      return did;
    });
    didLookups.set(handle, lookup);
  }
  return lookup;
}

async function fetchDid(handle: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    );

    if (!response.ok) {
      console.error('Failed to resolve Bluesky handle:', handle, response.statusText);
      return null;
    }

    const data = await response.json();
    return typeof data?.did === 'string' ? data.did : null;
  } catch (error) {
    console.error('Error resolving Bluesky handle:', handle, error);
    return null;
  }
}

// Test-only: the lookup cache is module-level, so tests reset it between cases
export function clearBlueskyDidCache(): void {
  didLookups.clear();
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
