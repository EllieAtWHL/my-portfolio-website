'use client';

import { useEffect, useRef } from 'react';

export default function BlueskyPost({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Extract the post ID from the URL
    const postIdMatch = url.match(/post\/([a-z0-9]+)/i);
    if (!postIdMatch) return console.error('Invalid Bluesky post URL');

    const postId = postIdMatch[1];

    // TODO: Replace this hard-coded DID with a function that resolves
    // a username from the URL to the correct DID dynamically
    const did = 'did:plc:cdc3vx72uppbg3v7hn7ftgp7';

    // Clear previous embed if it exists
    containerRef.current.innerHTML = '';

    // Create the blockquote
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'bluesky-embed';
    blockquote.setAttribute(
      'data-bluesky-uri',
      `at://${did}/app.bsky.feed.post/${postId}`
    );
    blockquote.setAttribute('data-bluesky-embed-color-mode', 'system');
    blockquote.innerHTML = `<p>Loading Bluesky post...</p>`;
    containerRef.current.appendChild(blockquote);

    // Load the Bluesky embed script
    const script = document.createElement('script');
    script.src = 'https://embed.bsky.app/static/embed.js';
    script.async = true;
    script.charset = 'utf-8';
    containerRef.current.appendChild(script);
  }, [url]);

  return <div ref={containerRef}></div>;
}
