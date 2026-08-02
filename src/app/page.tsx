'use client';

import MainSitePage from '@/components/MainSitePage';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useEffect } from 'react';
import { trackEvent, trackPageView } from '@/lib/fullstory';

export default function Home() {
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
          <h1 className="heading-1 slideLeft">Trailblazer.</h1>
          <h1 className="heading-1 slideRight">Mentor.</h1>
          <h1 className="heading-1 slideDown">Champion.</h1>
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
