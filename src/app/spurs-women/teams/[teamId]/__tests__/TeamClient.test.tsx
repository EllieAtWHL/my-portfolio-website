import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TeamClient from '../TeamClient'
import type { Team, Stadium } from '@/lib/data/stadiums'
import type { TeamPlayers } from '@/lib/data/teams'
import { makeMatch } from '@/test-utils/match-fixture'

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
  legacy_number: null,
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

const stadium: Stadium = {
  id: 'stadium-1',
  name: 'Brisbane Road',
  slug: 'brisbane-road',
  city: 'London',
  country: 'England',
  capacity: 9500,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 1,
  spurs_women: true,
  wikidata_qid: null,
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

  it('links to the home stadium and shows its match count, when a team has exactly one on record', async () => {
    mockGetMatchesForTeam.mockResolvedValue([
      makeMatch({ id: 'm1', stadium_id: 'stadium-1' }),
      makeMatch({ id: 'm2', stadium_id: 'stadium-1' }),
    ])

    render(<TeamClient team={team} teamId="1" stadiums={[stadium]} />)

    expect(screen.getByText('Home Stadium')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Brisbane Road' })
    expect(link).toHaveAttribute('href', '/spurs-women/stadiums/brisbane-road')
    expect(screen.getByText('· London, England')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('2 matches involving Tottenham Hotspur')).toBeInTheDocument()
    })
  })

  it('lists every stadium, pluralizes the heading, and sorts by match count (highest first)', async () => {
    const emirates: Stadium = { ...stadium, id: 'stadium-2', name: 'Emirates Stadium', slug: 'emirates-stadium' }
    mockGetMatchesForTeam.mockResolvedValue([
      makeMatch({ id: 'm1', stadium_id: 'stadium-1' }),
      makeMatch({ id: 'm2', stadium_id: 'stadium-2' }),
      makeMatch({ id: 'm3', stadium_id: 'stadium-2' }),
      makeMatch({ id: 'm4', stadium_id: 'stadium-2' }),
    ])

    // Passed in alphabetical order (Brisbane Road before Emirates Stadium) so the
    // rendered order can only match if match-count sorting actually ran.
    const { container } = render(<TeamClient team={team} teamId="1" stadiums={[stadium, emirates]} />)

    expect(screen.getByText('Home Stadiums')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('3 matches involving Tottenham Hotspur')).toBeInTheDocument()
    })

    const stadiumRows = Array.from(container.querySelectorAll('li')).map((li) => li.textContent)
    expect(stadiumRows[0]).toContain('Emirates Stadium')
    expect(stadiumRows[1]).toContain('Brisbane Road')
  })

  it('omits the Home Stadium section when no stadium is on record', async () => {
    render(<TeamClient team={team} teamId="1" stadiums={[]} />)

    await waitFor(() => {
      expect(screen.getByText('No matches found for this team.')).toBeInTheDocument()
    })
    expect(screen.queryByText('Home Stadium')).not.toBeInTheDocument()
    expect(screen.queryByText('Home Stadiums')).not.toBeInTheDocument()
  })

  it('shows the head-to-head record for a non-Tottenham opponent team', async () => {
    const opponent: Team = { ...team, id: 2, name: 'Chelsea', is_tottenham: false }
    mockGetMatchesForTeam.mockResolvedValue([
      makeMatch({ id: 'm1', spurs_score: 2, opponent_score: 1 }),
      makeMatch({ id: 'm2', spurs_score: 0, opponent_score: 0 }),
      makeMatch({ id: 'm3', spurs_score: 0, opponent_score: 1 }),
      makeMatch({ id: 'm4', spurs_score: null, opponent_score: null }),
    ])

    render(<TeamClient team={opponent} teamId="2" />)

    await waitFor(() => {
      expect(screen.getByText('Head-to-head vs Tottenham:')).toBeInTheDocument()
    })
    // Explicitly attributes each count to a side, rather than a bare "1W 1D 1L"
    // that leaves it ambiguous whose win/loss column is whose.
    expect(screen.getByText('Tottenham wins: 1 · Draws: 1 · Chelsea wins: 1')).toBeInTheDocument()
  })

  it('counts the result after extra time, but leaves a penalty shootout as a draw', async () => {
    const opponent: Team = { ...team, id: 3, name: 'Leicester City', is_tottenham: false }
    mockGetMatchesForTeam.mockResolvedValue([
      // 1-1 at 90 minutes, 2-1 after extra time (the 2024 FA Cup semi-final shape)
      makeMatch({ id: 'aet-win', spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 }),
      // level after extra time, lost on penalties: still a draw in the record
      makeMatch({ id: 'pens', spurs_score: 3, opponent_score: 3, spurs_score_aet: 3, opponent_score_aet: 3, spurs_score_pens: 3, opponent_score_pens: 4 }),
    ])

    render(<TeamClient team={opponent} teamId="3" />)

    await waitFor(() => {
      expect(screen.getByText('Head-to-head vs Tottenham:')).toBeInTheDocument()
    })
    expect(screen.getByText('Tottenham wins: 1 · Draws: 1 · Leicester City wins: 0')).toBeInTheDocument()
  })

  it('labels the record as overall (not head-to-head) on Tottenham\'s own team page', async () => {
    mockGetMatchesForTeam.mockResolvedValue([
      makeMatch({ id: 'm1', spurs_score: 2, opponent_score: 1 }),
    ])

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.getByText('Overall record:')).toBeInTheDocument()
    })
    expect(screen.getByText('Wins: 1 · Draws: 0 · Losses: 0')).toBeInTheDocument()
    expect(screen.queryByText('Head-to-head vs Tottenham:')).not.toBeInTheDocument()
  })

  it('omits the record summary when no matches have a recorded score', async () => {
    mockGetMatchesForTeam.mockResolvedValue([
      makeMatch({ id: 'm1', spurs_score: null, opponent_score: null }),
    ])

    render(<TeamClient team={team} teamId="1" />)

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading matches' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Overall record:')).not.toBeInTheDocument()
  })
})
