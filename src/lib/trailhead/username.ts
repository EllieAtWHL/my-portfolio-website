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

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  // salesforce.com profile URLs can carry a locale: /uk/trailblazer/<slug>.
  if (host === 'salesforce.com' && parts.length === 3 && /^[a-z]{2}(-[a-z]{2})?$/i.test(parts[0])) {
    parts.shift();
  }
  if (parts.length !== 2) {
    return null;
  }

  const [prefix, slug] = parts;
  const isTrailblazerMe = host === 'trailblazer.me' && prefix.toLowerCase() === 'id';
  const isSalesforce = host === 'salesforce.com' && prefix.toLowerCase() === 'trailblazer';
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
 * Returns the lowercased username from a bare username or a pasted
 * `trailblazer.me/id/…` / `salesforce.com/(<locale>/)trailblazer/…` profile
 * URL, or null if the input is empty or can't be a Trailhead username.
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
  // Trailhead resolves slugs case-insensitively and returns them lowercase
  // (checked live, Oct 31 2026), so lowercasing gives each profile one cache
  // entry, and one upstream scan, however it was typed.
  return username.toLowerCase();
}
