'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function SpursWomenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Spurs Women section error:', error);
  }, [error]);

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-2xl mx-auto text-center">
        <Card variant="spursAccent" padding="lg">
          <h1 className="spurs-text font-bold mb-4 text-2xl">Something went wrong</h1>
          <p className="spurs-text mb-6">
            We couldn&apos;t load this page. Please try again, or head back to the homepage.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="spurs" onClick={reset}>
              Try Again
            </Button>
            <Link href="/spurs-women">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
