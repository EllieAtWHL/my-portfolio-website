// This file intentionally runs under the default jsdom test environment,
// whose default location is http://localhost/ (hostname === 'localhost').
// That lets us verify the "hostname is localhost" gate blocks every
// tracking call even when window.FS is present, independently of the
// "window.FS exists" gate (covered together with the positive path in
// fullstory.non-localhost.test.ts, which pins a non-localhost URL via a
// @jest-environment-options docblock).
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

describe('fullstory (localhost host)', () => {
  beforeEach(() => {
    expect(window.location.hostname).toBe('localhost');
    delete window.FS;
  });

  it('isFullStoryAvailable is false when window.FS is not set', () => {
    expect(isFullStoryAvailable()).toBe(false);
  });

  it('isFullStoryAvailable is true once window.FS is set, regardless of hostname', () => {
    window.FS = {
      event: jest.fn(),
      setUserVars: jest.fn(),
      anonymize: jest.fn(),
      shutdown: jest.fn(),
      restart: jest.fn(),
      log: jest.fn(),
      consent: jest.fn(),
    };
    expect(isFullStoryAvailable()).toBe(true);
  });

  it('trackEvent does not call window.FS.event when FS is undefined', () => {
    expect(() => trackEvent('Test Event', { foo: 'bar' })).not.toThrow();
  });

  it('trackEvent does not call window.FS.event on localhost even when FS is defined', () => {
    const fsEvent = jest.fn();
    window.FS = {
      event: fsEvent,
      setUserVars: jest.fn(),
      anonymize: jest.fn(),
      shutdown: jest.fn(),
      restart: jest.fn(),
      log: jest.fn(),
      consent: jest.fn(),
    };

    trackEvent('Test Event', { foo: 'bar' });

    expect(fsEvent).not.toHaveBeenCalled();
  });

  it('setUserVars does not call window.FS.setUserVars on localhost even when FS is defined', () => {
    const setVars = jest.fn();
    window.FS = {
      event: jest.fn(),
      setUserVars: setVars,
      anonymize: jest.fn(),
      shutdown: jest.fn(),
      restart: jest.fn(),
      log: jest.fn(),
      consent: jest.fn(),
    };

    setUserVars({ plan: 'pro' });

    expect(setVars).not.toHaveBeenCalled();
  });

  it('the higher-level trackers (which all funnel through trackEvent) are also blocked on localhost', () => {
    const fsEvent = jest.fn();
    window.FS = {
      event: fsEvent,
      setUserVars: jest.fn(),
      anonymize: jest.fn(),
      shutdown: jest.fn(),
      restart: jest.fn(),
      log: jest.fn(),
      consent: jest.fn(),
    };

    trackNavigation('/a', '/b');
    trackFormInteraction('contact', 'start');
    trackButtonClick('submit', '/contact');
    trackPageView('/home');
    trackError('boom');

    expect(fsEvent).not.toHaveBeenCalled();
  });
});
