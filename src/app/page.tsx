'use client';

import MainSitePage from '@/components/MainSitePage';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function Home() {
  return (
    <MainSitePage>
      <div className="content">
        <div className="scrollable">
          <h1 className="slideLeft">Trailblazer.</h1>
          <h1 className="slideRight">Mentor.</h1>
          <h1 className="slideDown">Champion.</h1>
          <div className="contactMe fadeIn">
            <Button variant="primary" asChild>
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
