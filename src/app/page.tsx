'use client';

import Footer from '@/components/Footer';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function Home() {
  return (
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
      
      <Footer />
    </div>
  );
}
