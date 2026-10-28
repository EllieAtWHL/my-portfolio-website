export type SocialPlatform = 'bluesky' | 'instagram';

// Media.type is 'social media' for every platform (no per-platform DB field),
// so which embed to render is decided from the post URL's host alone.
export function getSocialPlatform(url: string): SocialPlatform | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (hostname === 'bsky.app') return 'bluesky';
  if (hostname === 'instagram.com' || hostname === 'www.instagram.com') return 'instagram';
  return null;
}

// Each embed platform's script scans the page for its blockquotes once, when it
// first runs - and isn't safe to run twice (Bluesky's embed.js redeclares a
// top-level const and throws). So it's loaded once per page: a blockquote added
// before the script finishes loading is picked up by that first scan, and one
// added after uses the script's own re-scan API.
export function loadEmbedScript(src: string, rescan: (() => void) | undefined): void {
  if (rescan) {
    rescan();
    return;
  }
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.charset = 'utf-8';
  document.body.appendChild(script);
}
