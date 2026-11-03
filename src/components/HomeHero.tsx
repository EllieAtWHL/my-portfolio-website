'use client';

import MainSitePage from '@/components/MainSitePage';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useEffect } from 'react';
import { trackEvent, trackPageView } from '@/lib/fullstory';

/**
 * Client half of the home page (tracking + animated hero). The page itself
 * (src/app/page.tsx) stays a server component so it can export metadata and
 * structured data (WEB-238).
 */
export default function HomeHero() {
  useEffect(() => {
    // Track home page view
    trackPageView('/', 'Home');
  }, []);

  const handleContactClick = () => {
    trackEvent('Button Clicked', {
      buttonName: 'Contact Me',
      page: '/',
      section: 'hero',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          {/* The name is the page's single <h1> - it's what search engines
              weigh most for a "Ellie Matthewman" query. The tagline keeps
              its .heading-1 look but as <p>s, so there aren't three h1s. */}
          <h1 className="heading-2 text-center">Ellie Matthewman</h1>
          <p className="heading-1 slideLeft">Trailblazer.</p>
          <p className="heading-1 slideRight">Mentor.</p>
          <p className="heading-1 slideDown">Champion.</p>
          <div className="contactMe fadeIn">
            <Button variant="primary" asChild onClick={handleContactClick}>
              <Link href="/contact-me">
                Contact Me
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainSitePage>
  );
}
