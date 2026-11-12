import { render, screen, fireEvent } from '@testing-library/react';
import { CookiePreferencesButton } from '../CookiePreferencesButton';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

describe('CookiePreferencesButton', () => {
  it('reopens the cookie banner', () => {
    const openPreferences = jest.fn();
    (useCookieConsent as jest.Mock).mockReturnValue({ openPreferences });

    render(<CookiePreferencesButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Cookie preferences' }));

    expect(openPreferences).toHaveBeenCalled();
  });
});
