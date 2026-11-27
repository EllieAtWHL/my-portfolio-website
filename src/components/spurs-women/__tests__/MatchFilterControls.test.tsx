import { render, screen, fireEvent } from '@testing-library/react'
import MatchFilterControls from '../MatchFilterControls'
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

const matches = [
  makeMatch({ id: 'win', date: '2026-01-01', spurs_score: 2, opponent_score: 0 }),
  // 1-1 at 90 minutes, 2-1 after extra time
  makeMatch({ id: 'aet-win', date: '2026-01-08', spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 }),
  // level after extra time, lost on penalties
  makeMatch({ id: 'pens', date: '2026-01-15', spurs_score: 3, opponent_score: 3, spurs_score_aet: 3, opponent_score_aet: 3, spurs_score_pens: 3, opponent_score_pens: 4 }),
  makeMatch({ id: 'loss', date: '2026-01-22', spurs_score: 0, opponent_score: 1 }),
  makeMatch({ id: 'unplayed', date: '2026-01-29', spurs_score: null, opponent_score: null }),
]

function filterByResult(result: 'won' | 'draw' | 'lost') {
  const onChange = jest.fn()
  render(<MatchFilterControls matches={matches} onFilteredMatchesChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Expand filters' }))
  fireEvent.change(screen.getByLabelText('Result'), { target: { value: result } })
  const latest: Match[] = onChange.mock.calls[onChange.mock.calls.length - 1][0]
  return latest.map((match) => match.id)
}

describe('MatchFilterControls result filter', () => {
  it('counts a match won after extra time as won', () => {
    expect(filterByResult('won')).toEqual(['win', 'aet-win'])
  })

  it('keeps a penalty shootout as a draw, and excludes the extra-time win', () => {
    expect(filterByResult('draw')).toEqual(['pens'])
  })

  it('leaves unplayed matches out of every result', () => {
    expect(filterByResult('lost')).toEqual(['loss'])
  })
})
