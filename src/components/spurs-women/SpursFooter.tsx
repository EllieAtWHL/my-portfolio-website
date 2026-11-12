'use client';

import Link from 'next/link';
import BlueskyLogo from './BlueskyLogo';
import { useCookieConsent } from '../CookieConsentProvider';
import { Button } from '../Button';
import CookieIcon from '../CookieIcon';


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
          <span aria-hidden="true"> · </span>
          {/* One privacy policy covers the whole site, so Spurs Women links to
              the main-site page rather than having its own. */}
          <Link href="/privacy-policy" className="linktree-link spurs-text venue-link">
            Privacy
          </Link>
        </p>
      </div>

      <div className="floatRight">
        <Button
          variant="spurs"
          size="xs"
          onClick={openPreferences}
          aria-label="Cookie preferences"
          title="Cookie preferences"
          className="p-1.5"
        >
          <CookieIcon size={18} />
        </Button>
      </div>

    </footer>
  );
}
