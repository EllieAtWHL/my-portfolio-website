'use client';

import React from 'react';
import { trackError } from '@/lib/fullstory';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  /** Passed through to trackError as context, so caught errors are attributable in FullStory. */
  context?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors in a subtree that a route-level error.tsx can't
 * reach on its own (e.g. inside a modal, or around a component that embeds
 * unpredictable third-party content) without taking down the rest of the page.
 * Route segments should keep using Next.js's error.tsx convention - reach for
 * this only for a subtree that needs to fail without the whole page unmounting.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
    trackError(error, this.props.context ?? 'error-boundary');
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      if (fallback) {
        return fallback;
      }
      return (
        <div role="alert" className="text-center p-4 text-gray-600 dark:text-gray-400">
          <p className="mb-2">Something went wrong.</p>
          <button type="button" onClick={this.reset} className="underline hover:no-underline">
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
