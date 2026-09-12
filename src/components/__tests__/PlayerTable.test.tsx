import { render, screen, fireEvent } from '@testing-library/react'
import PlayerTable from '../spurs-women/PlayerTable'
import type { PlayerWithStats } from '@/lib/data/teams'

const makePlayer = (overrides: Partial<PlayerWithStats>): PlayerWithStats => ({
  id: '1',
  first_name: 'First',
  last_name: 'Last',
  date_of_birth: null,
  nationality: 'England',
  position: 'Midfielder',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 10,
  legacy_number: null,
  current_club: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  appearances: 1,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  ...overrides,
})

describe('PlayerTable', () => {
  it('shows an empty-state message when there are no players', () => {
    render(<PlayerTable players={[]} />)

    expect(screen.getByText('No players to display')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders a row per player with their stats', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Bethany', last_name: 'England', squad_number: 9, nationality: 'England', position: 'Forward', appearances: 12, goals: 5, assists: 2, yellow_cards: 1, red_cards: 0 }),
    ]
    render(<PlayerTable players={players} />)

    const row = screen.getByRole('link', { name: 'Bethany England' }).closest('tr')!
    expect(row).toHaveTextContent('9')
    expect(row).toHaveTextContent('England')
    expect(row).toHaveTextContent('Forward')
    expect(row).toHaveTextContent('12')
    expect(row).toHaveTextContent('5')
    expect(row).toHaveTextContent('2')
    expect(row).toHaveTextContent('1')
  })

  it('constrains the table to a fixed scrollable height by default, but not when constrainHeight is false', () => {
    const players = [makePlayer({})]
    const { container, rerender } = render(<PlayerTable players={players} />)

    expect(container.querySelector('.max-h-96')).toBeInTheDocument()

    rerender(<PlayerTable players={players} constrainHeight={false} />)

    expect(container.querySelector('.max-h-96')).not.toBeInTheDocument()
  })

  it('links each player to their profile page', () => {
    render(<PlayerTable players={[makePlayer({ id: 'p42', first_name: 'Ann', last_name: 'Onym' })]} />)

    expect(screen.getByRole('link', { name: 'Ann Onym' })).toHaveAttribute('href', '/spurs-women/players/p42')
  })

  it('shows a dash for a missing squad number, nationality, or position', () => {
    const players = [makePlayer({ squad_number: null as unknown as number, nationality: '', position: '' })]
    render(<PlayerTable players={players} />)

    const row = screen.getByRole('link', { name: /Last/ }).closest('tr')!
    const cells = row.querySelectorAll('td')
    expect(cells[0]).toHaveTextContent('-')
    expect(cells[3]).toHaveTextContent('-')
    expect(cells[4]).toHaveTextContent('-')
  })

  it('omits the Current Club column unless showCurrentClub is set, since a team-scoped fetch never resolves it', () => {
    const players = [makePlayer({ current_club: { id: 5, name: 'Chelsea' } })]
    render(<PlayerTable players={players} />)

    expect(screen.queryByRole('columnheader', { name: /Current Club/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Chelsea')).not.toBeInTheDocument()
  })

  it("shows a player's current club when showCurrentClub is set, e.g. where a former Spurs player has gone on to, and a dash when unknown", () => {
    const players = [
      makePlayer({ first_name: 'Left', last_name: 'Player', current_club: { id: 5, name: 'Chelsea' } }),
      makePlayer({ id: '2', first_name: 'Unknown', last_name: 'Whereabouts', current_club: null }),
    ]
    render(<PlayerTable players={players} showCurrentClub />)

    expect(screen.getByRole('link', { name: 'Left Player' }).closest('tr')).toHaveTextContent('Chelsea')
    expect(screen.getByRole('link', { name: 'Unknown Whereabouts' }).closest('tr')).toHaveTextContent('-')
  })

  it('shows a legacy number badge in the Legacy # column (not next to the name), and a dash when unset', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Has', last_name: 'Legacy', legacy_number: 7 }),
      makePlayer({ id: '2', first_name: 'No', last_name: 'Legacy', legacy_number: null }),
    ]
    render(<PlayerTable players={players} />)

    const badge = screen.getByRole('img', { name: 'Legacy number 7' })
    expect(badge).toBeInTheDocument()
    expect(badge.closest('tr')).toBe(screen.getByRole('link', { name: 'Has Legacy' }).closest('tr'))
    expect(screen.getByRole('link', { name: 'Has Legacy' }).parentElement).not.toContainElement(badge)

    const noLegacyRow = screen.getByRole('link', { name: 'No Legacy' }).closest('tr')!
    expect(noLegacyRow.querySelectorAll('td')[1]).toHaveTextContent('-')
  })

  it('defaults to sorting by name ascending', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Zoe', last_name: 'Zeta' }),
      makePlayer({ id: '2', first_name: 'Amy', last_name: 'Alpha' }),
    ]
    render(<PlayerTable players={players} />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Amy Alpha')
    expect(links[1]).toHaveTextContent('Zoe Zeta')
  })

  it('sorts by a numeric column when its header is clicked, and shows a sort indicator', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Low', last_name: 'Scorer', goals: 1 }),
      makePlayer({ id: '2', first_name: 'High', last_name: 'Scorer', goals: 9 }),
    ]
    render(<PlayerTable players={players} />)

    fireEvent.click(screen.getByRole('columnheader', { name: /^Goals/ }))

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Low Scorer')
    expect(links[1]).toHaveTextContent('High Scorer')
    expect(screen.getByRole('columnheader', { name: /Goals ↑/ })).toBeInTheDocument()
  })

  it('reverses sort direction when the same header is clicked again', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Low', last_name: 'Scorer', goals: 1 }),
      makePlayer({ id: '2', first_name: 'High', last_name: 'Scorer', goals: 9 }),
    ]
    render(<PlayerTable players={players} />)

    const goalsHeader = screen.getByRole('columnheader', { name: /^Goals/ })
    fireEvent.click(goalsHeader)
    fireEvent.click(screen.getByRole('columnheader', { name: /Goals ↑/ }))

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('High Scorer')
    expect(links[1]).toHaveTextContent('Low Scorer')
    expect(screen.getByRole('columnheader', { name: /Goals ↓/ })).toBeInTheDocument()
  })

  it('sorts by legacy number, with unset numbers sorted last', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'Has', last_name: 'Legacy', legacy_number: 7 }),
      makePlayer({ id: '2', first_name: 'No', last_name: 'Legacy', legacy_number: null }),
      makePlayer({ id: '3', first_name: 'Also', last_name: 'Has', legacy_number: 101 }),
    ]
    render(<PlayerTable players={players} />)

    fireEvent.click(screen.getByRole('columnheader', { name: /^Legacy #/ }))

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Has Legacy')
    expect(links[1]).toHaveTextContent('Also Has')
    expect(links[2]).toHaveTextContent('No Legacy')
  })

  it('sorts by current club alphabetically, with unset clubs sorted first', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'At', last_name: 'Wolves', current_club: { id: 9, name: 'Wolves' } }),
      makePlayer({ id: '2', first_name: 'No', last_name: 'Club', current_club: null }),
      makePlayer({ id: '3', first_name: 'At', last_name: 'Chelsea', current_club: { id: 5, name: 'Chelsea' } }),
    ]
    render(<PlayerTable players={players} showCurrentClub />)

    fireEvent.click(screen.getByRole('columnheader', { name: /^Current Club/ }))

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('No Club')
    expect(links[1]).toHaveTextContent('At Chelsea')
    expect(links[2]).toHaveTextContent('At Wolves')
  })

  it('switching to a new sort column resets direction to ascending', () => {
    const players = [
      makePlayer({ id: '1', first_name: 'A', last_name: 'Aaronson', squad_number: 2, goals: 9 }),
      makePlayer({ id: '2', first_name: 'B', last_name: 'Barrett', squad_number: 1, goals: 1 }),
    ]
    render(<PlayerTable players={players} />)

    fireEvent.click(screen.getByRole('columnheader', { name: /^Goals/ }))
    fireEvent.click(screen.getByRole('columnheader', { name: /^#/ }))

    expect(screen.getByRole('columnheader', { name: /# ↑/ })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('B Barrett')
    expect(links[1]).toHaveTextContent('A Aaronson')
  })
})
