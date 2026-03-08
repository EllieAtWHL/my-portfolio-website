import { useEffect, useCallback } from 'react';
import { trackEvent, trackPageView, isFullStoryAvailable } from '@/lib/fullstory';

/**
 * React hook for FullStory tracking
 * Provides safe tracking functions that work client-side only
 */
export const useFullStory = () => {
  // Track page views when route changes
  const trackPage = useCallback((page: string, title?: string) => {
    trackPageView(page, title);
  }, []);

  // Track custom events
  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    trackEvent(eventName, properties);
  }, []);

  // Track button clicks
  const trackClick = useCallback((buttonName: string, page: string, additionalProps?: Record<string, unknown>) => {
    trackEvent('Button Clicked', {
      buttonName,
      page,
      ...additionalProps,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Track form interactions
  const trackForm = useCallback((formName: string, action: 'start' | 'validation_error' | 'success' | 'abandon', field?: string) => {
    trackEvent('Form Interaction', {
      formName,
      action,
      field,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Auto-track page views on mount/route change
  useEffect(() => {
    if (isFullStoryAvailable()) {
      const page = window.location.pathname;
      const title = document.title;
      trackPageView(page, title);
    }
  }, [trackPage]);

  return {
    track,
    trackPage,
    trackClick,
    trackForm,
    isAvailable: isFullStoryAvailable()
  };
};
