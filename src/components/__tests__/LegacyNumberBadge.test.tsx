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
    expect(badge).toHaveStyle({ width: '38px', height: '44px' })
  })

  it('renders at a smaller size when size="sm" is passed', () => {
    render(<LegacyNumberBadge number={3} size="sm" />)

    const badge = screen.getByRole('img', { name: 'Legacy number 3' })
    expect(badge).toHaveStyle({ width: '26px', height: '30px' })
  })

  it('renders at a larger size when size="lg" is passed', () => {
    render(<LegacyNumberBadge number={101} size="lg" />)

    const badge = screen.getByRole('img', { name: 'Legacy number 101' })
    expect(badge).toHaveStyle({ width: '61px', height: '71px' })
  })

  it('stays the same fixed size for a 3-digit number as for a 1-digit number', () => {
    const { unmount } = render(<LegacyNumberBadge number={7} size="sm" />)
    const shortBadge = screen.getByRole('img', { name: 'Legacy number 7' })
    expect(shortBadge).toHaveStyle({ width: '26px', height: '30px' })
    unmount()

    render(<LegacyNumberBadge number={101} size="sm" />)
    const longBadge = screen.getByRole('img', { name: 'Legacy number 101' })
    expect(longBadge).toHaveStyle({ width: '26px', height: '30px' })
  })

  it('applies an additional className when provided', () => {
    render(<LegacyNumberBadge number={7} className="ml-2" />)

    expect(screen.getByRole('img', { name: 'Legacy number 7' })).toHaveClass('legacy-number-badge', 'ml-2')
  })
})
