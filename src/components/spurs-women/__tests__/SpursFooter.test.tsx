import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '../SpursFooter'
import { useCookieConsent } from '../../CookieConsentProvider'

jest.mock('../../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}))

const mockUseCookieConsent = useCookieConsent as jest.Mock

describe('SpursFooter', () => {
  beforeEach(() => {
    mockUseCookieConsent.mockReturnValue({ openPreferences: jest.fn() })
  })

  it('links out to the Bluesky profile', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /Bluesky/ })).toHaveAttribute(
      'href',
      'https://bsky.app/profile/ellieatwhl.co.uk'
    )
  })

  it('reopens cookie preferences when the footer link is clicked', () => {
    const openPreferences = jest.fn()
    mockUseCookieConsent.mockReturnValue({ openPreferences })

    render(<Footer />)
    screen.getByRole('button', { name: 'Cookie preferences' }).click()

    expect(openPreferences).toHaveBeenCalled()
  })
})
