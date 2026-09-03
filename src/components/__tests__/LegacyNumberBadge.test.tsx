import { render, screen } from '@testing-library/react'
import LegacyNumberBadge from '../spurs-women/LegacyNumberBadge'

describe('LegacyNumberBadge', () => {
  it('renders the number with an accessible label', () => {
    render(<LegacyNumberBadge number={7} />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Legacy number 7' })).toBeInTheDocument()
  })

  it('defaults to the medium size', () => {
    render(<LegacyNumberBadge number={12} />)

    const badge = screen.getByRole('img', { name: 'Legacy number 12' })
    expect(badge).toHaveStyle({ width: '32px', height: '38px' })
  })

  it('renders at a smaller size when size="sm" is passed', () => {
    render(<LegacyNumberBadge number={3} size="sm" />)

    const badge = screen.getByRole('img', { name: 'Legacy number 3' })
    expect(badge).toHaveStyle({ width: '20px', height: '24px' })
  })

  it('renders at a larger size when size="lg" is passed', () => {
    render(<LegacyNumberBadge number={101} size="lg" />)

    const badge = screen.getByRole('img', { name: 'Legacy number 101' })
    expect(badge).toHaveStyle({ width: '52px', height: '62px' })
  })

  it('applies an additional className when provided', () => {
    render(<LegacyNumberBadge number={7} className="ml-2" />)

    expect(screen.getByRole('img', { name: 'Legacy number 7' })).toHaveClass('legacy-number-badge', 'ml-2')
  })
})
