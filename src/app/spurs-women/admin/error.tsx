'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { trackError } from '@/lib/fullstory';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin section error:', error);
    trackError(error, 'spurs-women/admin/error-boundary');
  }, [error]);

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-2xl mx-auto text-center">
        <Card variant="spursAccent" padding="lg">
          <h1 className="spurs-text font-bold mb-4 text-2xl">Something went wrong</h1>
          <p className="spurs-text mb-6">
            The admin dashboard hit an error. Your unsaved changes may be lost - please try again.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="spurs" onClick={reset}>
              Try Again
            </Button>
            <Link href="/spurs-women/admin">
              <Button variant="spurs">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
