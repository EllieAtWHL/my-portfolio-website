// Turns whatever a visitor typed into a Trailhead profile username (FR-1).
//
// The URL handling is adapted from nabondance/Trailhead-Banner's
// extractUsernameFromUrl (src/utils/usernameValidation.js),
// Copyright (c) 2025, nabondance, used under the BSD-3-Clause licence in
// ./LICENSE-trailhead-banner.txt.

// Trailhead profile slugs seen in practice are letters, digits, hyphens and
// underscores. Dots are allowed too, to be safe. Anything else (spaces, "@",
// "/", "?") can't be a slug, so it's rejected here rather than spending an
// upstream request on it.
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{1,80}$/;

function usernameFromProfileUrl(candidate: string): string | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const [prefix, slug, ...rest] = url.pathname.split('/').filter(Boolean);
  if (!slug || rest.length > 0) {
    return null;
  }

  const isTrailblazerMe = host === 'trailblazer.me' && prefix.toLowerCase() === 'id';
  const isSalesforce =
    (host === 'salesforce.com' || host === 'www.salesforce.com') && prefix.toLowerCase() === 'trailblazer';
  if (!isTrailblazerMe && !isSalesforce) {
    return null;
  }

  try {
    return decodeURIComponent(slug);
  } catch {
    return null;
  }
}

/**
 * Returns the username from a bare username or a pasted
 * `trailblazer.me/id/…` / `salesforce.com/trailblazer/…` profile URL, or null
 * if the input is empty or can't be a Trailhead username.
 */
export function parseTrailheadUsername(input: string): string | null {
  const trimmed = input.trim();
  // Profile URLs are often pasted with surrounding text or trailing
  // punctuation, or without the scheme ("trailblazer.me/id/…").
  const urlMatch = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  let username: string | null = trimmed;
  if (urlMatch) {
    username = usernameFromProfileUrl(urlMatch[0].replace(/[),;!?.]+$/, ''));
  } else if (trimmed.includes('/')) {
    username = usernameFromProfileUrl(`https://${trimmed}`);
  }

  if (!username || !USERNAME_PATTERN.test(username)) {
    return null;
  }
  return username;
}
