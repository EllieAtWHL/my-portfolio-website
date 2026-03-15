import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('button', 'primary', 'px-4', 'py-2', 'text-base')
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('secondary')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-gray-600', 'hover:text-gray-900')

    rerender(<Button variant="spurs">Spurs</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('spurs-button')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('handles fullWidth prop', () => {
    render(<Button fullWidth>Full width</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    
    // Check for spinner
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders icon on the left by default', () => {
    const icon = <span data-testid="icon">📦</span>
    render(<Button icon={icon}>With icon</Button>)
    
    const button = screen.getByRole('button')
    const iconElement = screen.getByTestId('icon')
    
    expect(iconElement).toBeInTheDocument()
    expect(button).toContainElement(iconElement)
  })

  it('renders icon on the right when specified', () => {
    const icon = <span data-testid="icon">📦</span>
    render(<Button icon={icon} iconPosition="right">With icon</Button>)
    
    const button = screen.getByRole('button')
    const iconElement = screen.getByTestId('icon')
    
    expect(iconElement).toBeInTheDocument()
    expect(button).toContainElement(iconElement)
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger click when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('passes through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom label">Button</Button>)
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom styled</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('handles asChild prop correctly', () => {
    const CustomComponent = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      ({ children, ...props }, ref) => <a ref={ref} {...props}>{children}</a>
    )
    CustomComponent.displayName = 'CustomComponent'

    render(
      <Button asChild>
        <CustomComponent href="/test">Link button</CustomComponent>
      </Button>
    )

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveClass('button', 'primary')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toHaveTextContent('Ref button')
  })
})
