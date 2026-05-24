import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../page'
import { trackPageView } from '@/lib/fullstory'

// Mock the fullstory module
jest.mock('@/lib/fullstory', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn()
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock MainSitePage component
jest.mock('@/components/MainSitePage', () => {
  return function MockMainSitePage({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-site-page">{children}</div>
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main headings', () => {
    render(<Home />)
    
    expect(screen.getByText('Trailblazer.')).toBeInTheDocument()
    expect(screen.getByText('Mentor.')).toBeInTheDocument()
    expect(screen.getByText('Champion.')).toBeInTheDocument()
  })

  it('renders the contact button', () => {
    render(<Home />)
    
    const contactButton = screen.getByRole('link', { name: 'Contact Me' })
    expect(contactButton).toBeInTheDocument()
    expect(contactButton).toHaveAttribute('href', '/contact-me')
  })

  it('tracks page view on mount', () => {
    render(<Home />)
    
    expect(trackPageView).toHaveBeenCalledWith('/', 'Home')
    expect(trackPageView).toHaveBeenCalledTimes(1)
  })

  it('renders contact button with correct props', () => {
    render(<Home />)
    
    const contactButton = screen.getByRole('link', { name: 'Contact Me' })
    expect(contactButton).toBeInTheDocument()
    expect(contactButton).toHaveAttribute('href', '/contact-me')
    
    // Verify the button container has the correct class
    const buttonContainer = screen.getByText('Contact Me').closest('.contactMe')
    expect(buttonContainer).toBeInTheDocument()
    expect(buttonContainer).toHaveClass('fadeIn')
  })

  it('has correct CSS classes for animations', () => {
    render(<Home />)
    
    const trailblazerHeading = screen.getByText('Trailblazer.')
    const mentorHeading = screen.getByText('Mentor.')
    const championHeading = screen.getByText('Champion.')
    
    expect(trailblazerHeading).toHaveClass('slideLeft')
    expect(mentorHeading).toHaveClass('slideRight')
    expect(championHeading).toHaveClass('slideDown')
  })

  it('renders within MainSitePage wrapper', () => {
    render(<Home />)
    
    const mainSitePage = screen.getByTestId('main-site-page')
    expect(mainSitePage).toBeInTheDocument()
  })

  it('has proper content structure', () => {
    render(<Home />)
    
    const content = screen.getByText('Trailblazer.').closest('.content-with-footer')
    const scrollable = screen.getByText('Trailblazer.').closest('.scrollable')
    
    expect(content).toBeInTheDocument()
    expect(scrollable).toBeInTheDocument()
  })
})
