import { render, screen } from '@testing-library/react'
import SeasonStats from '../SeasonStats'
import type { Match } from '@/lib/data/matches'

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  date: '2026-03-01',
  kickoff_time: '15:00',
  home_team: { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', primary_color: '#132257', secondary_color: '#ffffff', is_tottenham: true },
  away_team: { id: 2, name: 'Chelsea', short_name: 'Chelsea', primary_color: '#034694', secondary_color: '#ffffff', is_tottenham: false },
  spurs_score: 2,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  attended: false,
  is_home_match: true,
  is_neutral_venue: false,
  stadium_id: 'stadium-1',
  stadium_display_name: 'Tottenham Hotspur Stadium',
  stadium_slug: 'tottenham-hotspur-stadium',
  attendance: null,
  notes: null,
  competitions: { name: 'Womens Super League' },
  season_id: 'season-1',
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
  ...overrides,
})

// Each stat is rendered as a "Label:" span followed by its value span.
const statValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent

describe('SeasonStats', () => {
  it('shows an empty state when no league match has a score', () => {
    render(<SeasonStats seasonName="2025-26" matches={[makeMatch({ spurs_score: null, opponent_score: null })]} />)

    expect(screen.getByText('No completed matches available for statistics calculation.')).toBeInTheDocument()
  })

  it('works out the league record, goals and clean sheets from scored WSL matches only', () => {
    render(
      <SeasonStats
        seasonName="2025-26"
        matches={[
          makeMatch({ id: 'w', spurs_score: 3, opponent_score: 0 }),
          makeMatch({ id: 'd', spurs_score: 1, opponent_score: 1 }),
          makeMatch({ id: 'l', spurs_score: 0, opponent_score: 2 }),
          makeMatch({ id: 'unplayed', spurs_score: null, opponent_score: null }),
          makeMatch({ id: 'cup', spurs_score: 5, opponent_score: 0, competitions: { name: 'FA Cup' } }),
          makeMatch({ id: 'friendly', spurs_score: 4, opponent_score: 0, competitions: { name: 'Friendly' } }),
        ]}
      />
    )

    expect(statValue('Total Matches:')).toBe('3')
    expect(statValue('Wins:')).toBe('1')
    expect(statValue('Draws:')).toBe('1')
    expect(statValue('Losses:')).toBe('1')
    expect(statValue('Points/Game:')).toBe('1.33')
    expect(statValue('Goals Scored:')).toBe('4')
    expect(statValue('Goals Conceded:')).toBe('3')
    expect(statValue('Clean Sheets:')).toBe('1')
  })

  it('uses the score after extra time, so a 90-minute draw won in extra time is a win', () => {
    render(
      <SeasonStats
        seasonName="2025-26"
        matches={[
          // 1-1 at 90 minutes, 2-1 after extra time
          makeMatch({ id: 'aet', spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 }),
        ]}
      />
    )

    expect(statValue('Wins:')).toBe('1')
    expect(statValue('Draws:')).toBe('0')
    expect(statValue('Goals Scored:')).toBe('2')
    expect(statValue('Goals Conceded:')).toBe('1')
  })

  it('still counts a match decided on penalties as a draw', () => {
    render(
      <SeasonStats
        seasonName="2025-26"
        matches={[
          makeMatch({ id: 'pens', spurs_score: 3, opponent_score: 3, spurs_score_aet: 3, opponent_score_aet: 3, spurs_score_pens: 3, opponent_score_pens: 4 }),
        ]}
      />
    )

    expect(statValue('Wins:')).toBe('0')
    expect(statValue('Draws:')).toBe('1')
    expect(statValue('Losses:')).toBe('0')
  })
})
