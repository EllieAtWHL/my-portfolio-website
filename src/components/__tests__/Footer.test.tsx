import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '../Footer'
import { useCookieConsent } from '../CookieConsentProvider'

jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false, toggleDarkMode: jest.fn() })
}))

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}))

const mockUseCookieConsent = useCookieConsent as jest.Mock

describe('Footer', () => {
  beforeEach(() => {
    mockUseCookieConsent.mockReturnValue({ openPreferences: jest.fn() })
  })

  it('gives the dark-mode checkbox an accessible name', () => {
    render(<Footer />)
    expect(screen.getByRole('checkbox', { name: 'Toggle dark mode' })).toBeInTheDocument()
  })

  it('hides the decorative sun/moon icons from assistive tech', () => {
    render(<Footer />)
    const icons = document.querySelectorAll('.sun-icon, .moon-icon')
    expect(icons).toHaveLength(2)
    icons.forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'))
  })

  it('reopens cookie preferences when the footer link is clicked', () => {
    const openPreferences = jest.fn()
    mockUseCookieConsent.mockReturnValue({ openPreferences })

    render(<Footer />)
    screen.getByRole('button', { name: 'Cookie preferences' }).click()

    expect(openPreferences).toHaveBeenCalled()
  })
})
