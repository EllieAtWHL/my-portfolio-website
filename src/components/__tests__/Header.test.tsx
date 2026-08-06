import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '../Header'

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) {
    return <a href={href} onClick={onClick}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, className }: { 
    src: string; alt: string; width: number; height: number; className?: string 
  }) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />
  }
})

// Mock ThemeProvider
jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false })
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders logo and navigation items', () => {
    render(<Header />)
    
    // Check logo
    const logo = screen.getByAltText('EllieAtWHL')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logo.png')
    expect(logo).toHaveAttribute('width', '50')
    expect(logo).toHaveAttribute('height', '35')
    
    // Check navigation items
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About Me')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('London 2012')).toBeInTheDocument()
    expect(screen.getByText('Spurs Women')).toBeInTheDocument()
    expect(screen.getByText('Contact Me')).toBeInTheDocument()
  })

  it('renders navigation links with correct hrefs', () => {
    render(<Header />)
    
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
    
    const aboutLink = screen.getByText('About Me').closest('a')
    expect(aboutLink).toHaveAttribute('href', '/about-me')
    
    const spursLink = screen.getByText('Spurs Women').closest('a')
    expect(spursLink).toHaveAttribute('href', '/spurs-women')
  })

  it('renders menu toggle button with correct attributes', () => {
    render(<Header />)
    
    const toggleButton = screen.getByLabelText('Toggle menu')
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('role', 'button')
    expect(toggleButton).toHaveAttribute('tabIndex', '0')
  })

  it('renders three bars in toggle button', () => {
    render(<Header />)
    
    const bars = screen.getAllByRole('button')[0].querySelectorAll('.bar')
    expect(bars).toHaveLength(3)
  })

  it('toggles menu when toggle button is clicked', () => {
    render(<Header />)
    
    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')
    
    // Initially closed
    expect(nav).not.toHaveClass('active')
    
    // Click to open
    fireEvent.click(toggleButton)
    expect(nav).toHaveClass('active')
    
    // Click to close
    fireEvent.click(toggleButton)
    expect(nav).not.toHaveClass('active')
  })

  it('toggles menu when Enter key is pressed on toggle button', () => {
    render(<Header />)
    
    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')
    
    // Initially closed
    expect(nav).not.toHaveClass('active')
    
    // Press Enter to open
    fireEvent.keyDown(toggleButton, { key: 'Enter' })
    expect(nav).toHaveClass('active')
  })

  it('toggles menu when Space key is pressed on toggle button', () => {
    render(<Header />)

    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')

    // Press the actual space character (e.key === ' '), not the unrelated
    // "Space" string some other keyboard events use for e.code
    fireEvent.keyDown(toggleButton, { key: ' ' })
    expect(nav).toHaveClass('active')
  })

  it('does not toggle menu for other keys', () => {
    render(<Header />)

    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')

    // Press an unrelated key
    fireEvent.keyDown(toggleButton, { key: 'Tab' })
    expect(nav).not.toHaveClass('active')
  })

  it('exposes aria-expanded reflecting menu state, and aria-controls pointing at the nav', () => {
    render(<Header />)

    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(toggleButton).toHaveAttribute('aria-controls', nav.id)

    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes menu when navigation link is clicked', () => {
    render(<Header />)
    
    const toggleButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByRole('navigation')
    
    // Open menu first
    fireEvent.click(toggleButton)
    expect(nav).toHaveClass('active')
    
    // Click a link
    const aboutLink = screen.getByText('About Me')
    fireEvent.click(aboutLink)
    
    // Menu should close
    expect(nav).not.toHaveClass('active')
  })

  it('does not apply dark mode class when isDarkMode is false', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).not.toHaveClass('dark')
  })

  it('renders navigation as list with proper structure', () => {
    render(<Header />)
    
    const nav = screen.getByRole('navigation')
    const list = nav.querySelector('ul')
    const listItems = list?.querySelectorAll('li')
    
    expect(nav).toBeInTheDocument()
    expect(list).toBeInTheDocument()
    expect(listItems).toHaveLength(7) // 7 navigation items
  })

  it('logo links to home page', () => {
    render(<Header />)
    
    const logoLink = screen.getByAltText('EllieAtWHL').closest('a')
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('has proper ARIA labels', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    const nav = screen.getByRole('navigation')
    const toggleButton = screen.getByLabelText('Toggle menu')
    
    expect(header).toBeInTheDocument()
    expect(nav).toBeInTheDocument()
    expect(toggleButton).toBeInTheDocument()
  })

  it('initially renders with menu closed', () => {
    render(<Header />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).not.toHaveClass('active')
  })
})
