import { checkMatchScores, PENS_WITHOUT_EXTRA_TIME_WARNING, type MatchScores } from '../match-score-rules';

const score = (
  ft: [number, number] | null,
  aet: [number, number] | null = null,
  pens: [number, number] | null = null
): MatchScores => ({
  spurs_score: ft?.[0] ?? null,
  opponent_score: ft?.[1] ?? null,
  spurs_score_aet: aet?.[0] ?? null,
  opponent_score_aet: aet?.[1] ?? null,
  spurs_score_pens: pens?.[0] ?? null,
  opponent_score_pens: pens?.[1] ?? null,
});

describe('checkMatchScores', () => {
  describe('valid scores', () => {
    it.each([
      ['an unplayed fixture', score(null)],
      ['a 90-minute result', score([2, 1])],
      ['a 90-minute draw', score([1, 1])],
      ['extra time with goals', score([1, 1], [2, 1])],
      ['a goalless extra time', score([1, 1], [1, 1], [4, 3])],
      ['penalties after a level extra time', score([0, 0], [1, 1], [5, 4])],
    ])('accepts %s with no errors or warnings', (_label, scores) => {
      expect(checkMatchScores(scores)).toEqual({ errors: [], warnings: [] });
    });

    it('treats missing fields the same as null', () => {
      expect(checkMatchScores({})).toEqual({ errors: [], warnings: [] });
    });
  });

  describe('pairs must be both-or-neither', () => {
    it.each([
      ['90-minute', { ...score(null), spurs_score: 1 }],
      ['extra-time', { ...score([1, 1]), opponent_score_aet: 2 }],
      ['penalty', { ...score([1, 1], [1, 1]), spurs_score_pens: 4 }],
    ])('errors on a half-entered %s score', (label, scores) => {
      expect(checkMatchScores(scores).errors).toContain(`Enter both ${label} scores, or neither.`);
    });
  });

  describe('extra time', () => {
    it('errors when the 90-minute score is not level', () => {
      expect(checkMatchScores(score([2, 1], [3, 1])).errors).toEqual([
        'Extra time is only possible when the 90-minute score is level.',
      ]);
    });

    it('errors when there is no 90-minute score', () => {
      expect(checkMatchScores(score(null, [1, 1])).errors).toEqual(['An extra-time score needs a 90-minute score too.']);
    });

    it.each([
      ['Spurs', score([2, 2], [1, 3])],
      ['the opponent', score([2, 2], [3, 1])],
    ])('errors when %s goals go down in extra time', (_side, scores) => {
      expect(checkMatchScores(scores).errors).toEqual([
        'The extra-time score includes the 90-minute goals, so it can\'t be lower than the 90-minute score.',
      ]);
    });
  });

  describe('penalties', () => {
    it('errors when the extra-time score is not level', () => {
      expect(checkMatchScores(score([1, 1], [2, 1], [4, 3])).errors).toEqual([
        'Penalties are only possible when the extra-time score is level.',
      ]);
    });

    it('errors when there is no extra time and the 90-minute score is not level', () => {
      const result = checkMatchScores(score([2, 1], null, [4, 3]));
      expect(result.errors).toEqual(['Penalties are only possible when the 90-minute score is level.']);
      // The warning is only worth giving once the scores are otherwise valid.
      expect(result.warnings).toEqual([]);
    });

    it('errors when there is no score to decide', () => {
      expect(checkMatchScores(score(null, null, [4, 3])).errors).toEqual([
        'A penalty shootout needs a 90-minute score too.',
      ]);
    });

    it('errors on a level shootout', () => {
      expect(checkMatchScores(score([1, 1], [1, 1], [4, 4])).errors).toEqual(['A penalty shootout can\'t end level.']);
    });

    it('warns, without erroring, on penalties with no extra-time score', () => {
      expect(checkMatchScores(score([1, 1], null, [4, 3]))).toEqual({
        errors: [],
        warnings: [PENS_WITHOUT_EXTRA_TIME_WARNING],
      });
    });
  });
});
