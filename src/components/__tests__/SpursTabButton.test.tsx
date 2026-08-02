import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SpursTabButton from '../spurs-women/SpursTabButton'

describe('SpursTabButton', () => {
  it('renders children as button label', () => {
    render(
      <SpursTabButton isActive={false} onClick={() => {}}>
        Current (3)
      </SpursTabButton>
    )

    expect(screen.getByRole('button', { name: 'Current (3)' })).toBeInTheDocument()
  })

  it('applies active styling when isActive is true', () => {
    render(
      <SpursTabButton isActive={true} onClick={() => {}}>
        Active tab
      </SpursTabButton>
    )

    const button = screen.getByRole('button', { name: 'Active tab' })
    expect(button).toHaveClass('text-[var(--spurs-dark-accent)]', 'bg-[var(--spurs-dark-bg-1)]', 'border-[var(--spurs-dark-accent)]')
  })

  it('applies inactive styling when isActive is false', () => {
    render(
      <SpursTabButton isActive={false} onClick={() => {}}>
        Inactive tab
      </SpursTabButton>
    )

    const button = screen.getByRole('button', { name: 'Inactive tab' })
    expect(button).toHaveClass('text-gray-300', 'bg-[var(--spurs-dark-opacity-30)]', 'border-transparent')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(
      <SpursTabButton isActive={false} onClick={handleClick}>
        Click me
      </SpursTabButton>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables the button when disabled is true', () => {
    render(
      <SpursTabButton isActive={false} onClick={() => {}} disabled>
        Disabled tab
      </SpursTabButton>
    )

    expect(screen.getByRole('button', { name: 'Disabled tab' })).toBeDisabled()
  })
})
