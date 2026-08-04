/**
 * @jest-environment-options {"url": "https://example.com/some/page"}
 */
// Pinning a non-localhost URL via the jsdom environment docblock lets us
// exercise the real "both gates open" path (window.FS present AND
// hostname !== 'localhost'), plus the "FS missing" gate independently of
// hostname. The "hostname is localhost" gate is covered in fullstory.test.ts.
import {
  trackEvent,
  setUserVars,
  trackNavigation,
  trackFormInteraction,
  trackButtonClick,
  trackPageView,
  trackError,
  isFullStoryAvailable,
} from '../fullstory';

const NOW = '2026-01-01T12:00:00.000Z';

function installFS() {
  const fs = {
    event: jest.fn(),
    setUserVars: jest.fn(),
    anonymize: jest.fn(),
    shutdown: jest.fn(),
    restart: jest.fn(),
    log: jest.fn(),
    consent: jest.fn(),
  };
  window.FS = fs;
  return fs;
}

describe('fullstory (non-localhost host)', () => {
  beforeEach(() => {
    expect(window.location.hostname).toBe('example.com');
    delete window.FS;
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('trackEvent does not call FS.event when window.FS is undefined, even off localhost', () => {
    expect(() => trackEvent('Test Event')).not.toThrow();
  });

  it('trackEvent calls window.FS.event with the exact name and properties when both gates are open', () => {
    const fs = installFS();

    trackEvent('Test Event', { foo: 'bar' });

    expect(fs.event).toHaveBeenCalledTimes(1);
    expect(fs.event).toHaveBeenCalledWith('Test Event', { foo: 'bar' });
  });

  it('trackEvent forwards an undefined properties argument as-is', () => {
    const fs = installFS();

    trackEvent('No Props Event');

    expect(fs.event).toHaveBeenCalledWith('No Props Event', undefined);
  });

  it('setUserVars calls window.FS.setUserVars with the exact vars object', () => {
    const fs = installFS();

    setUserVars({ plan: 'pro', signedIn: true });

    expect(fs.setUserVars).toHaveBeenCalledWith({ plan: 'pro', signedIn: true });
  });

  it('setUserVars does not call FS.setUserVars when window.FS is undefined', () => {
    expect(() => setUserVars({ plan: 'pro' })).not.toThrow();
  });

  it('trackNavigation builds a Navigation event with from/to/method and an ISO timestamp, defaulting method to click', () => {
    const fs = installFS();

    trackNavigation('/a', '/b');

    expect(fs.event).toHaveBeenCalledWith('Navigation', {
      from: '/a',
      to: '/b',
      method: 'click',
      timestamp: NOW,
    });
  });

  it('trackNavigation uses an explicit method when provided', () => {
    const fs = installFS();

    trackNavigation('/a', '/b', 'search');

    expect(fs.event).toHaveBeenCalledWith('Navigation', {
      from: '/a',
      to: '/b',
      method: 'search',
      timestamp: NOW,
    });
  });

  it('trackFormInteraction builds a Form Interaction event with the exact shape', () => {
    const fs = installFS();

    trackFormInteraction('contact', 'validation_error', 'email');

    expect(fs.event).toHaveBeenCalledWith('Form Interaction', {
      formName: 'contact',
      action: 'validation_error',
      field: 'email',
      timestamp: NOW,
    });
  });

  it('trackButtonClick builds a Button Clicked event that spreads in additional props', () => {
    const fs = installFS();

    trackButtonClick('submit', '/contact', { variant: 'primary' });

    expect(fs.event).toHaveBeenCalledWith('Button Clicked', {
      buttonName: 'submit',
      page: '/contact',
      variant: 'primary',
      timestamp: NOW,
    });
  });

  it('trackPageView builds a Page View event including the current document.referrer', () => {
    const fs = installFS();

    trackPageView('/home', 'Home Page');

    expect(fs.event).toHaveBeenCalledWith('Page View', {
      page: '/home',
      title: 'Home Page',
      referrer: document.referrer,
      timestamp: NOW,
    });
  });

  it('trackError extracts message and stack from an Error instance', () => {
    const fs = installFS();
    const err = new Error('boom');

    trackError(err, 'checkout');

    expect(fs.event).toHaveBeenCalledWith('Error', {
      message: 'boom',
      stack: err.stack,
      context: 'checkout',
      timestamp: NOW,
    });
  });

  it('trackError treats a plain string as the message with no stack', () => {
    const fs = installFS();

    trackError('something broke');

    expect(fs.event).toHaveBeenCalledWith('Error', {
      message: 'something broke',
      stack: undefined,
      context: undefined,
      timestamp: NOW,
    });
  });

  it('isFullStoryAvailable reflects window.FS presence off localhost too', () => {
    expect(isFullStoryAvailable()).toBe(false);
    installFS();
    expect(isFullStoryAvailable()).toBe(true);
  });
});
