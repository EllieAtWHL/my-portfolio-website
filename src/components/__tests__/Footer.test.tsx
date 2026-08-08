import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false, toggleDarkMode: jest.fn() })
}))

describe('Footer', () => {
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
})
