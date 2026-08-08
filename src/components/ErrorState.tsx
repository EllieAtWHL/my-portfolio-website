import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  cardVariant?: 'default' | 'accent' | 'spursAccent';
  buttonVariant?: 'primary' | 'spurs';
  className?: string;
}

// Distinguishes "the fetch actually failed" from "there's genuinely no data" -
// the two rendered identically before this existed (silent catch + empty
// list). Deliberately not a toast/notification system: this replaces the
// failed content in place, matching how these call sites already render an
// empty-state Card, rather than layering a separate global notification UI.
export function ErrorState({
  message = "We couldn't load this content. Please try again.",
  onRetry,
  cardVariant = 'default',
  buttonVariant = 'primary',
  className,
}: ErrorStateProps) {
  return (
    <Card variant={cardVariant} padding="lg" className={cn('text-center', className)}>
      <div role="alert" className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
          </svg>
          <p className="font-medium">{message}</p>
        </div>
        {onRetry && (
          <Button variant={buttonVariant} onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
}
