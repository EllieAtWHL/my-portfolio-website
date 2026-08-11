'use client';

import BlueskyLogo from './BlueskyLogo';
import { useCookieConsent } from '../CookieConsentProvider';
import { Button } from '../Button';


export default function Footer() {
  const { openPreferences } = useCookieConsent();

  return (
    <footer className={`spurs footer`}>
      <div className="findMe floatLeft">
        <p>
          Follow me on {' '}
          <a
            href="https://bsky.app/profile/ellieatwhl.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="linktree-link spurs-text venue-link inline-flex items-center gap-1"
          >
            <BlueskyLogo size={16} className="inline-block" />
            Bluesky
          </a>
        </p>
        <p>
          <Button variant="ghost" size="xs" onClick={openPreferences}>
            Cookie preferences
          </Button>
        </p>
      </div>

    </footer>
  );
}
