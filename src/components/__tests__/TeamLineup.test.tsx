import { render, screen, fireEvent } from '@testing-library/react'
import TeamLineup from '../spurs-women/TeamLineup'
import type { TeamLineup as TeamLineupData, PlayerStats, PlayerWithStats } from '@/lib/data/players'

const baseStats: PlayerStats = {
  id: 'stat-1',
  player_id: 'player-1',
  match_id: 'match-1',
  team_id: 1,
  started: false,
  was_substitute: false,
  was_unused_substitute: false,
  minute_on: null,
  minute_off: null,
  minutes_played: 0,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  clean_sheet: null,
  saves: null,
  shots: 0,
  shots_on_target: 0,
  passes_completed: null,
  passes_attempted: null,
  tackles: null,
  interceptions: null,
  clearances: null,
  fouls_committed: null,
  fouls_won: null,
  offsides: null,
  player_rating: null,
  player_of_the_match: false,
  created_at: '2026-01-01T00:00:00Z',
}

const makePlayer = (
  id: string,
  overrides: Partial<PlayerStats>
): PlayerWithStats => ({
  id,
  first_name: 'First',
  last_name: `Player${id}`,
  date_of_birth: null,
  nationality: 'England',
  position: 'Midfielder',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 10,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  player_stats: { ...baseStats, id: `stat-${id}`, player_id: id, ...overrides },
})

const lineupWithAllTabs: TeamLineupData = {
  team_id: 1,
  players: [
    makePlayer('1', { started: true }),
    makePlayer('2', { started: true }),
    makePlayer('3', { was_substitute: true }),
    makePlayer('4', { was_unused_substitute: true }),
  ],
}

describe('TeamLineup', () => {
  it('defaults to the Starting XI tab and shows starters', () => {
    render(<TeamLineup lineup={lineupWithAllTabs} />)

    expect(screen.getByRole('button', { name: 'Starting XI (2)' })).toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByText('First Player1')).toBeInTheDocument()
    expect(screen.getByText('First Player2')).toBeInTheDocument()
    expect(screen.queryByText('First Player3')).not.toBeInTheDocument()
  })

  it('switches to the Substitutes tab on click and shows that tab as active', () => {
    render(<TeamLineup lineup={lineupWithAllTabs} />)

    fireEvent.click(screen.getByRole('button', { name: 'Substitutes (1)' }))

    expect(screen.getByRole('button', { name: 'Substitutes (1)' })).toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByRole('button', { name: 'Starting XI (2)' })).not.toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByText('First Player3')).toBeInTheDocument()
    expect(screen.queryByText('First Player1')).not.toBeInTheDocument()
  })

  it('switches to the Unused tab on click', () => {
    render(<TeamLineup lineup={lineupWithAllTabs} />)

    fireEvent.click(screen.getByRole('button', { name: 'Unused (1)' }))

    expect(screen.getByRole('button', { name: 'Unused (1)' })).toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByText('First Player4')).toBeInTheDocument()
  })

  it('disables a tab whose category has zero players', () => {
    const lineup: TeamLineupData = {
      team_id: 1,
      players: [
        makePlayer('1', { started: true }),
        makePlayer('2', { was_substitute: true }),
      ],
    }

    render(<TeamLineup lineup={lineup} />)

    expect(screen.getByRole('button', { name: 'Starting XI (1)' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Substitutes (1)' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Unused (0)' })).toBeDisabled()
  })

  it('sorts by position using a partial-match fallback for non-exact position strings', () => {
    const lineup: TeamLineupData = {
      team_id: 1,
      players: [
        { ...makePlayer('fwd', { started: true }), position: 'Left Winger' },
        { ...makePlayer('unknown', { started: true }), position: 'Utility Player' },
        { ...makePlayer('gk', { started: true }), position: 'Backup GK' },
        { ...makePlayer('mid', { started: true }), position: 'Attacking Mid' },
        { ...makePlayer('def', { started: true }), position: 'Right Back' },
      ],
    }

    render(<TeamLineup lineup={lineup} />)

    const names = screen.getAllByText(/^First Player/).map((el) => el.textContent)
    expect(names).toEqual([
      'First Playergk',
      'First Playerdef',
      'First Playermid',
      'First Playerfwd',
      'First Playerunknown',
    ])
  })

  it('does not render tabs and falls back to a flat list when no player has stats', () => {
    const lineup: TeamLineupData = {
      team_id: 1,
      players: [
        { ...makePlayer('1', {}), player_stats: null },
      ],
    }

    render(<TeamLineup lineup={lineup} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('First Player1')).toBeInTheDocument()
  })
})
