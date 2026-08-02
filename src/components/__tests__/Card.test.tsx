import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Card } from '../Card'

describe('Card Component', () => {
  it('renders with default props', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    )
    
    const card = screen.getByText('Card content').closest('.rounded-xl')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('transition-all', 'duration-300', 'w-full', 'max-w-full')
    expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'shadow-lg', 'p-6', 'no-hover')
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(
      <Card variant="highlight">
        <p>Highlight card</p>
      </Card>
    )
    let card = screen.getByText('Highlight card').closest('.rounded-xl')
    expect(card).toHaveClass('highlight')

    rerender(
      <Card variant="bordered">
        <p>Bordered card</p>
      </Card>
    )
    card = screen.getByText('Bordered card').closest('.rounded-xl')
    expect(card).toHaveClass('border-2', 'border-gray-200', 'dark:border-gray-600')

    rerender(
      <Card variant="accent">
        <p>Accent card</p>
      </Card>
    )
    card = screen.getByText('Accent card').closest('.rounded-xl')
    expect(card).toHaveClass('accent-card')

    rerender(
      <Card variant="spursAccent">
        <p>Spurs accent card</p>
      </Card>
    )
    card = screen.getByText('Spurs accent card').closest('.rounded-xl')
    expect(card).toHaveClass('spurs-accent-card')
  })

  it('applies padding classes correctly', () => {
    const { rerender } = render(
      <Card padding="sm">
        <p>Small padding</p>
      </Card>
    )
    let card = screen.getByText('Small padding').closest('.rounded-xl')
    expect(card).toHaveClass('p-4')

    rerender(
      <Card padding="lg">
        <p>Large padding</p>
      </Card>
    )
    card = screen.getByText('Large padding').closest('.rounded-xl')
    expect(card).toHaveClass('p-8')
  })

  it('applies accent variant with padding', () => {
    render(
      <Card variant="accent" padding="sm">
        <p>Accent card with small padding</p>
      </Card>
    )
    
    const card = screen.getByText('Accent card with small padding').closest('.rounded-xl')
    expect(card).toHaveClass('accent-card', 'p-4')
  })

  it('disables hover effects when hover is false', () => {
    render(
      <Card hover={false}>
        <p>No hover</p>
      </Card>
    )
    
    const card = screen.getByText('No hover').closest('.rounded-xl')
    expect(card).not.toHaveClass('hover:shadow-xl', 'hover:-translate-y-1')
  })

  it('adds cursor-pointer when onClick is provided', () => {
    render(
      <Card onClick={() => {}}>
        <p>Clickable card</p>
      </Card>
    )
    
    const card = screen.getByText('Clickable card').closest('.rounded-xl')
    expect(card).toHaveClass('cursor-pointer')
  })

  it('handles click events when onClick is provided', () => {
    const handleClick = jest.fn()
    render(
      <Card onClick={handleClick}>
        <p>Clickable card</p>
      </Card>
    )
    
    const card = screen.getByText('Clickable card').closest('.rounded-xl')
    fireEvent.click(card!)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not add cursor-pointer when onClick is not provided', () => {
    render(
      <Card>
        <p>Non-clickable card</p>
      </Card>
    )
    
    const card = screen.getByText('Non-clickable card').closest('.rounded-xl')
    expect(card).not.toHaveClass('cursor-pointer')
  })

  it('applies custom className', () => {
    render(
      <Card className="custom-test-class">
        <p>Custom styled card</p>
      </Card>
    )
    
    const card = screen.getByText('Custom styled card').closest('.rounded-xl')
    expect(card).toHaveClass('custom-test-class')
  })

  it('combines all props correctly', () => {
    const handleClick = jest.fn()
    render(
      <Card 
        variant="bordered" 
        padding="lg" 
        hover={false}
        clickable={true}
        onClick={handleClick}
        className="test-combined"
      >
        <p>Combined props card</p>
      </Card>
    )
    
    const card = screen.getByText('Combined props card').closest('.rounded-xl')
    expect(card).toHaveClass(
      'transition-all', 'duration-300', 'w-full', 'max-w-full',
      'bg-white', 'dark:bg-gray-800', 'border-2', 'border-gray-200', 'dark:border-gray-600',
      'shadow-lg', 'p-8', 'cursor-pointer', 'test-combined'
    )
    expect(card).not.toHaveClass('hover:shadow-xl', 'hover:-translate-y-1')
  })

  it('filters out empty class names correctly', () => {
    render(
      <Card className="">
        <p>Empty className</p>
      </Card>
    )
    
    const card = screen.getByText('Empty className').closest('.rounded-xl')
    expect(card).toBeInTheDocument()
    expect(card?.className).not.toContain('  ') // No double spaces
  })

  it('renders complex children correctly', () => {
    render(
      <Card>
        <div>
          <h2>Card Title</h2>
          <p>Card description</p>
          <button>Card Button</button>
        </div>
      </Card>
    )
    
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description')).toBeInTheDocument()
    expect(screen.getByText('Card Button')).toBeInTheDocument()
  })
})
