import { render } from '@testing-library/react';
import { FullStoryLoader } from '../FullStoryLoader';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock('next/script', () => {
  return function MockScript(props: { src: string }) {
    return <div data-testid="fullstory-script" data-src={props.src} />;
  };
});

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('FullStoryLoader', () => {
  it.each([
    ['nothing is allowed', () => false],
    ['every other category is allowed', (category: string) => category !== 'sessionRecording'],
  ])('renders nothing when %s', (_label, hasConsent) => {
    mockUseCookieConsent.mockReturnValue({ hasConsent });

    const { container } = render(<FullStoryLoader />);

    expect(container.querySelector('[data-testid="fullstory-script"]')).not.toBeInTheDocument();
  });

  it('loads /fullstory-init.js once session recording is allowed', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: (category: string) => category === 'sessionRecording' });

    const { container } = render(<FullStoryLoader />);

    expect(container.querySelector('[data-testid="fullstory-script"]')).toHaveAttribute(
      'data-src',
      '/fullstory-init.js'
    );
  });
});
