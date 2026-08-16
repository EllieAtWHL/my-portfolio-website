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
  it.each(['rejected', null] as const)('renders nothing when consent is %s', (consent) => {
    mockUseCookieConsent.mockReturnValue({ consent });

    const { container } = render(<FullStoryLoader />);

    expect(container.querySelector('[data-testid="fullstory-script"]')).not.toBeInTheDocument();
  });

  it('loads /fullstory-init.js once consent is accepted', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted' });

    const { container } = render(<FullStoryLoader />);

    expect(container.querySelector('[data-testid="fullstory-script"]')).toHaveAttribute(
      'data-src',
      '/fullstory-init.js'
    );
  });
});
