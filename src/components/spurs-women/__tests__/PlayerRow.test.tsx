import { render, screen } from '@testing-library/react'
import PlayerRow from '../PlayerRow'
import type { PlayerStats, PlayerWithStats } from '@/lib/data/players'

const baseStats: PlayerStats = {
  id: 'stat-1',
  player_id: 'player-1',
  match_id: 'match-1',
  team_id: 1,
  started: true,
  was_substitute: false,
  was_unused_substitute: false,
  minute_on: null,
  minute_off: null,
  minutes_played: 90,
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

const makePlayer = (overrides: Partial<PlayerStats>): PlayerWithStats => ({
  id: 'player-1',
  first_name: 'First',
  last_name: 'Player',
  date_of_birth: null,
  nationality: 'England',
  position: 'Midfielder',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 10,
  legacy_number: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  player_stats: { ...baseStats, ...overrides },
})

describe('PlayerRow', () => {
  it('shows no card indicator when the player has no cards', () => {
    render(<PlayerRow player={makePlayer({})} />)

    expect(screen.queryByText(/🟨/)).not.toBeInTheDocument()
    expect(screen.queryByText(/🟥/)).not.toBeInTheDocument()
  })

  it('shows a single yellow card indicator for one booking', () => {
    render(<PlayerRow player={makePlayer({ yellow_cards: 1 })} />)

    expect(screen.getByText('🟨')).toBeInTheDocument()
  })

  it('shows a straight red card indicator distinctly from a second yellow', () => {
    render(<PlayerRow player={makePlayer({ yellow_cards: 0, red_cards: 1 })} />)

    expect(screen.getByText('🟥')).toBeInTheDocument()
  })

  it('shows a second-yellow-to-red indicator distinctly from a straight red', () => {
    render(<PlayerRow player={makePlayer({ yellow_cards: 2, red_cards: 1 })} />)

    expect(screen.getByText('🟨🟥')).toBeInTheDocument()
  })

  it('does not drop an earlier caution when a player also has an unrelated red card', () => {
    // yellow_cards and red_cards are entered independently, so 1 yellow + 1 red can mean
    // an earlier caution plus a later, unrelated straight red - not just a second yellow.
    render(<PlayerRow player={makePlayer({ yellow_cards: 1, red_cards: 1 })} />)

    expect(screen.getByText('🟨🟥')).toBeInTheDocument()
  })

  it('renders card indicators alongside goals and assists', () => {
    render(<PlayerRow player={makePlayer({ goals: 1, assists: 2, yellow_cards: 1 })} />)

    expect(screen.getByText(/1 ⚽️/)).toBeInTheDocument()
    expect(screen.getByText(/2 👟/)).toBeInTheDocument()
    expect(screen.getByText(/🟨/)).toBeInTheDocument()
  })

  it('renders card indicators for substitutes too', () => {
    render(
      <PlayerRow
        player={makePlayer({
          started: false,
          was_substitute: true,
          minute_on: 70,
          yellow_cards: 1,
        })}
      />
    )

    expect(screen.getByText(/🟨/)).toBeInTheDocument()
  })
})
