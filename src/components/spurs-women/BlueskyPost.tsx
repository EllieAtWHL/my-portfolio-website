'use client';

import { useEffect, useRef } from 'react';
import { getBlueskyEmbedUri } from '@/lib/bluesky';
import { loadEmbedScript } from '@/lib/social-embed';

declare global {
  interface Window {
    bluesky?: { scan: () => void };
  }
}

export default function BlueskyPost({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) return;

    // Clear previous embed if it exists
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Resolving the author's handle to a DID is async, so a URL change (or
    // unmount) mid-lookup must not let the stale result render afterwards.
    let cancelled = false;

    getBlueskyEmbedUri(url).then((uri) => {
      // Unparseable URL or failed handle lookup - already logged, render nothing
      if (cancelled || !uri || !containerRef.current) return;

      // Create the blockquote
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'bluesky-embed';
      blockquote.setAttribute('data-bluesky-uri', uri);
      blockquote.setAttribute('data-bluesky-embed-color-mode', 'system');
      blockquote.innerHTML = `<p>Loading Bluesky post...</p>`;
      containerRef.current.appendChild(blockquote);

      // Load the Bluesky embed script (or re-scan, if another post already did)
      loadEmbedScript('https://embed.bsky.app/static/embed.js', window.bluesky?.scan);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <div ref={containerRef}></div>;
}
