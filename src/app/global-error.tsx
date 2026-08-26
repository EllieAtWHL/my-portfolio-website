'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/Button';
import { trackError } from '@/lib/fullstory';
import './globals.css';

// Only fires if the root layout itself throws - a sibling error.tsx can't
// catch that, since it renders *inside* the layout it's a sibling of. Kept
// deliberately minimal (its own <html>/<body>, no ThemeProvider/
// CookieConsentProvider) since those are part of the layout that just failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout error:', error);
    trackError(error, 'root/global-error-boundary');
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning data-theme-loading>
      <head>
        <Script src="/theme-script.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <div className="max-w-2xl mx-auto text-center py-24 px-8">
          <h1 className="heading-1">Something went wrong</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            The site hit an unexpected error. Please try again.
          </p>
          <Button variant="primary" size="lg" onClick={reset}>
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
