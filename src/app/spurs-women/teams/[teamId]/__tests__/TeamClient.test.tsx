import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TeamClient from '../TeamClient'
import type { Team } from '@/lib/data/stadiums'
import type { TeamPlayers } from '@/lib/data/teams'

jest.mock('@/lib/data/teams', () => ({
  getMatchesForTeam: jest.fn(),
  getPlayersForTeam: jest.fn(),
}))

// This file only exercises the Current/Former players tab behaviour, not the
// matches/filter section below it - stubbed out so these tests stay scoped
// to what they actually assert on (rather than incidentally exercising two
// large, separately-tested components with every render).
jest.mock('@/components/spurs-women/MatchCard', () => {
  return function MockMatchCard() { return null; };
});

jest.mock('@/components/spurs-women/MatchFilterControls', () => {
  return function MockMatchFilterControls() { return null; };
});

import { getMatchesForTeam, getPlayersForTeam } from '@/lib/data/teams'

const mockGetMatchesForTeam = getMatchesForTeam as jest.Mock
const mockGetPlayersForTeam = getPlayersForTeam as jest.Mock

const team: Team = {
  id: 1,
  name: 'Tottenham Hotspur',
  short_name: 'Spurs',
  primary_color: '#132257',
  secondary_color: '#ffffff',
  is_tottenham: true,
}

const makePlayer = (id: string, lastName: string) => ({
  id,
  first_name: 'First',
  last_name: lastName,
  date_of_birth: null,
  nationality: 'England',
  position: 'Midfielder',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 10,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  appearances: 1,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
});

const players: TeamPlayers = {
  current: [makePlayer('1', 'Current-Player')],
  former: [makePlayer('2', 'Former-Player-A'), makePlayer('3', 'Former-Player-B')],
}

describe('TeamClient', () => {
  beforeEach(() => {
    mockGetMatchesForTeam.mockReset().mockResolvedValue([])
    mockGetPlayersForTeam.mockReset().mockResolvedValue(players)
  })

  it('shows loading skeletons instead of "no matches found" while data is still in flight', async () => {
    // Deferred promises: fetches stay pending until we resolve them below, so we
    // can assert on the in-between state React actually renders on first paint.
    let resolveMatches!: (value: []) => void
    let resolvePlayers!: (value: TeamPlayers) => void
    mockGetMatchesForTeam.mockReturnValue(new Promise((resolve) => { resolveMatches = resolve }))
    mockGetPlayersForTeam.mockReturnValue(new Promise((resolve) => { resolvePlayers = resolve }))

    render(<TeamClient team={team} teamId="1" />)

    expect(screen.getByRole('status', { name: 'Loading matches' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading players' })).toBeInTheDocument()
    expect(screen.queryByText('No matches found for this team.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Current/ })).not.toBeInTheDocument()

    resolveMatches([])
    resolvePlayers(players)

    await waitFor(() => {
      expect(screen.getByText('No matches found for this team.')).toBeInTheDocument()
    })
    expect(screen.queryByRole('status', { name: 'Loading matches' })).not.toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading players' })).not.toBeInTheDocument()
  })

  it('defaults to the Current players tab', async () => {
    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Current (1)' })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Current (1)' })).toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByText('First Current-Player')).toBeInTheDocument()
    expect(screen.queryByText('First Former-Player-A')).not.toBeInTheDocument()
  })

  it('switches to the Former players tab on click', async () => {
    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Former (2)' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Former (2)' }))

    expect(screen.getByRole('button', { name: 'Former (2)' })).toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByRole('button', { name: 'Current (1)' })).not.toHaveClass('text-[var(--spurs-dark-accent)]')
    expect(screen.getByText('First Former-Player-A')).toBeInTheDocument()
    expect(screen.getByText('First Former-Player-B')).toBeInTheDocument()
    expect(screen.queryByText('First Current-Player')).not.toBeInTheDocument()
  })

  it('disables a players tab when that category is empty', async () => {
    mockGetPlayersForTeam.mockResolvedValue({ current: [], former: players.former })

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Current (0)' })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Current (0)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Former (2)' })).not.toBeDisabled()
  })

  it('does not render the Players section when there are no current or former players', async () => {
    mockGetPlayersForTeam.mockResolvedValue({ current: [], former: [] })

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading players' })).not.toBeInTheDocument()
    })

    expect(screen.queryByText('Players')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Current/ })).not.toBeInTheDocument()
  })

  it('shows a distinguishable error state instead of "no matches" when the fetch fails', async () => {
    mockGetMatchesForTeam.mockRejectedValue(new Error('network down'))

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't load matches for this team. Please try again."
      )
    })

    expect(screen.queryByText('No matches found for this team.')).not.toBeInTheDocument()
  })

  it('retries the fetch when the error state\'s retry button is clicked', async () => {
    mockGetMatchesForTeam.mockRejectedValueOnce(new Error('network down')).mockResolvedValue([])

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(screen.getByText('No matches found for this team.')).toBeInTheDocument()
    })
    expect(mockGetMatchesForTeam).toHaveBeenCalledTimes(2)
  })
})
