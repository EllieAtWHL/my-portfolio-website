import { render, screen, fireEvent } from '@testing-library/react'
import MatchFilterControls from '../MatchFilterControls'
import type { Match } from '@/lib/data/matches'
import { makeMatch } from '@/test-utils/match-fixture'

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
