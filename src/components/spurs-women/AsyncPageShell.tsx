import { ReactNode } from 'react';
import { ErrorState } from '@/components/ErrorState';

interface AsyncPageShellProps {
  loading: boolean;
  hasError: boolean;
  onRetry: () => void;
  // e.g. "players" -> "Loading players..."
  loadingLabel: string;
  // Shown above the ErrorState on error - not repeated during loading (loading
  // never showed a heading before this was extracted, and changing that would
  // be a visible behaviour change this shell isn't meant to introduce).
  heading: string;
  errorMessage: string;
  children: ReactNode;
}

// Shared <main>/max-w-6xl wrapper and loading/error rendering for the Spurs
// Women list pages built on useRetryableAsync (PlayersClient, MatchesClient) -
// see WEB-158. The success-state heading stays page-specific (passed as part
// of children), since pages vary its layout/margin - only the loading and
// error markup was ever byte-identical across pages.
export default function AsyncPageShell({
  loading,
  hasError,
  onRetry,
  loadingLabel,
  heading,
  errorMessage,
  children,
}: AsyncPageShellProps) {
  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center">
            <p className="spurs-text text-lg">Loading {loadingLabel}...</p>
          </div>
        ) : hasError ? (
          <>
            <h1 className="spurs-text font-bold mb-8 text-center">{heading}</h1>
            <ErrorState
              message={errorMessage}
              onRetry={onRetry}
              cardVariant="spursAccent"
              buttonVariant="spurs"
            />
          </>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
