'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import MainSitePage from '@/components/MainSitePage';
import { Button } from '@/components/Button';
import { trackError } from '@/lib/fullstory';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Site error:', error);
    trackError(error, 'root/error-boundary');
  }, [error]);

  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="heading-1">Something went wrong</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We couldn&apos;t load this page. Please try again, or head back to the homepage.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" onClick={reset}>
                Try Again
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainSitePage>
  );
}
