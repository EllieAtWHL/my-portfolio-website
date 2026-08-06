import React from 'react'
import { render, screen } from '@testing-library/react'
import { SkipLink } from '../SkipLink'

describe('SkipLink', () => {
  it('links to #main-content by default', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toHaveAttribute('href', '#main-content')
  })

  it('links to a custom target id when provided', () => {
    render(<SkipLink targetId="admin-main-content" />)
    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toHaveAttribute('href', '#admin-main-content')
  })

  it('is visually hidden until focused', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toHaveClass('sr-only', 'focus:not-sr-only')
  })
})
