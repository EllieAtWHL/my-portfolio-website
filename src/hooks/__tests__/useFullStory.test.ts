import { renderHook } from '@testing-library/react';
import { useFullStory } from '../useFullStory';
import { trackEvent, trackPageView, isFullStoryAvailable } from '@/lib/fullstory';

jest.mock('@/lib/fullstory', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  isFullStoryAvailable: jest.fn(),
}));

const mockTrackEvent = trackEvent as jest.Mock;
const mockTrackPageView = trackPageView as jest.Mock;
const mockIsFullStoryAvailable = isFullStoryAvailable as jest.Mock;

const NOW = '2026-01-01T12:00:00.000Z';

describe('useFullStory', () => {
  beforeEach(() => {
    mockTrackEvent.mockReset();
    mockTrackPageView.mockReset();
    mockIsFullStoryAvailable.mockReset();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('trackPage calls trackPageView with the given page and title', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.trackPage('/about', 'About');

    expect(mockTrackPageView).toHaveBeenCalledWith('/about', 'About');
  });

  it('track calls trackEvent with the given event name and properties', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.track('Custom Event', { key: 'value' });

    expect(mockTrackEvent).toHaveBeenCalledWith('Custom Event', { key: 'value' });
  });

  it('trackClick calls trackEvent with Button Clicked, merging buttonName, page, spread props, and a timestamp', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.trackClick('submit', '/contact', { variant: 'primary' });

    expect(mockTrackEvent).toHaveBeenCalledWith('Button Clicked', {
      buttonName: 'submit',
      page: '/contact',
      variant: 'primary',
      timestamp: NOW,
    });
  });

  it('trackClick works with no additionalProps', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.trackClick('submit', '/contact');

    expect(mockTrackEvent).toHaveBeenCalledWith('Button Clicked', {
      buttonName: 'submit',
      page: '/contact',
      timestamp: NOW,
    });
  });

  it('trackForm calls trackEvent with Form Interaction, formName, action, field, and a timestamp', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.trackForm('contact', 'success', 'email');

    expect(mockTrackEvent).toHaveBeenCalledWith('Form Interaction', {
      formName: 'contact',
      action: 'success',
      field: 'email',
      timestamp: NOW,
    });
  });

  it('trackForm works with no field argument', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useFullStory());

    result.current.trackForm('contact', 'abandon');

    expect(mockTrackEvent).toHaveBeenCalledWith('Form Interaction', {
      formName: 'contact',
      action: 'abandon',
      field: undefined,
      timestamp: NOW,
    });
  });

  it('isAvailable reflects isFullStoryAvailable()', () => {
    mockIsFullStoryAvailable.mockReturnValue(true);
    const { result } = renderHook(() => useFullStory());

    expect(result.current.isAvailable).toBe(true);
  });

  it('fires trackPageView on mount when isFullStoryAvailable() is true', () => {
    mockIsFullStoryAvailable.mockReturnValue(true);

    renderHook(() => useFullStory());

    expect(mockTrackPageView).toHaveBeenCalledWith(window.location.pathname, document.title);
  });

  it('does not fire trackPageView on mount when isFullStoryAvailable() is false', () => {
    mockIsFullStoryAvailable.mockReturnValue(false);

    renderHook(() => useFullStory());

    expect(mockTrackPageView).not.toHaveBeenCalled();
  });
});
