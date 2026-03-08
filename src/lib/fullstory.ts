// FullStory tracking utilities
// This file provides safe wrapper functions for FullStory analytics

// Type definitions for FullStory
interface FullStoryAPI {
  event: (name: string, properties?: Record<string, unknown>) => void;
  setUserVars: (vars: Record<string, unknown>) => void;
  anonymize: () => void;
  shutdown: () => void;
  restart: () => void;
  log: (level: string, message: string) => void;
  consent: (granted: boolean) => void;
}

declare global {
  interface Window {
    FS?: FullStoryAPI;
  }
}

/**
 * Safely track events with FullStory
 * Only works if FullStory is loaded and not in localhost
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && 
      window.FS && 
      window.location.hostname !== 'localhost') {
    window.FS.event(eventName, properties);
  }
};

/**
 * Set user properties in FullStory (for session-level data, not user identification)
 */
export const setUserVars = (vars: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && 
      window.FS && 
      window.location.hostname !== 'localhost') {
    window.FS.setUserVars(vars);
  }
};

/**
 * Track navigation events
 */
export const trackNavigation = (from: string, to: string, method: 'click' | 'direct' | 'search' = 'click') => {
  trackEvent('Navigation', {
    from,
    to,
    method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track form interactions
 */
export const trackFormInteraction = (formName: string, action: 'start' | 'validation_error' | 'success' | 'abandon', field?: string) => {
  trackEvent('Form Interaction', {
    formName,
    action,
    field,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track button clicks
 */
export const trackButtonClick = (buttonName: string, page: string, additionalProps?: Record<string, unknown>) => {
  trackEvent('Button Clicked', {
    buttonName,
    page,
    ...additionalProps,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track page views with additional context
 */
export const trackPageView = (page: string, title?: string) => {
  trackEvent('Page View', {
    page,
    title,
    referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
    timestamp: new Date().toISOString()
  });
};

/**
 * Track errors
 */
export const trackError = (error: Error | string, context?: string) => {
  trackEvent('Error', {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  });
};

/**
 * Check if FullStory is available
 */
export const isFullStoryAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.FS;
};
