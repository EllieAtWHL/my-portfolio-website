'use client';

import { useEffect, useRef } from 'react';
import { useCookieConsent } from '../CookieConsentProvider';
import { EmbedConsentFallback } from '../ConsentGatedEmbed';
import { loadEmbedScript } from '@/lib/social-embed';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function InstagramPost({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasConsent: hasConsentFor, isConsentKnown } = useCookieConsent();
  const hasConsent = hasConsentFor('embeds');

  useEffect(() => {
    // Meta's embed sets instagram.com/facebook.com cookies even for
    // logged-out viewers, so like the YouTube/Spotify embeds (and unlike
    // Bluesky/OpenStreetMap, which set none) it stays behind the "Embedded
    // content" consent category (WEB-147, WEB-104) - see the fallback below.
    if (!url || !hasConsent) return;

    // Clear previous embed if it exists
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create the blockquote (Meta's documented embed markup). The link is
    // built via the DOM rather than innerHTML because the URL is admin data.
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'instagram-media';
    blockquote.setAttribute('data-instgrm-permalink', url);
    blockquote.setAttribute('data-instgrm-version', '14');
    const link = document.createElement('a');
    // Shown until embed.js swaps in the iframe (or for good, if it's blocked) -
    // same Spurs link styling as the fallback below, not the global green <a>.
    link.className = 'spurs-text venue-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View this post on Instagram';
    blockquote.appendChild(link);
    if (containerRef.current) {
      containerRef.current.appendChild(blockquote);
    }

    // Load the Instagram embed script (or re-scan, if another post already did)
    const embeds = window.instgrm?.Embeds;
    loadEmbedScript('https://www.instagram.com/embed.js', embeds && (() => embeds.process()));
  }, [url, hasConsent]);

  // Until the stored choice has been read, render nothing rather than the
  // fallback, so a visitor who already accepted isn't told to accept cookies.
  if (!isConsentKnown) return null;

  // The two branches are keyed apart so React swaps the element rather than
  // reusing it - otherwise withdrawing consent would keep the iframe Meta's
  // script injected (outside React's control) alive next to the fallback.
  if (!hasConsent) {
    return (
      <div key="fallback">
        <EmbedConsentFallback
          service="Instagram"
          href={url}
          linkLabel="View this post on Instagram"
          theme="spurs"
        />
      </div>
    );
  }

  return <div key="embed" ref={containerRef}></div>;
}
