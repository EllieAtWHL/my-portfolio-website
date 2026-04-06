import { useEffect, useCallback } from 'react';
import { trackEvent, trackPageView, isFullStoryAvailable } from '@/lib/fullstory';

export const useFullStory = () => {
  const trackPage = useCallback((page: string, title?: string) => {
    trackPageView(page, title);
  }, []);

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    trackEvent(eventName, properties);
  }, []);

  const trackClick = useCallback((buttonName: string, page: string, additionalProps?: Record<string, unknown>) => {
    trackEvent('Button Clicked', {
      buttonName,
      page,
      ...additionalProps,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackForm = useCallback((formName: string, action: 'start' | 'validation_error' | 'success' | 'abandon', field?: string) => {
    trackEvent('Form Interaction', {
      formName,
      action,
      field,
      timestamp: new Date().toISOString()
    });
  }, []);

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
