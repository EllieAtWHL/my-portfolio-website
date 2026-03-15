import {
  formatDateConsistent,
  formatDateWithMonthName,
  formatDateForCard,
  formatDateForArticle
} from '../date'

describe('Date Utility Functions', () => {
  const testDate = '2024-03-15T10:30:00Z'
  const testDate2 = '2024-12-01T15:45:30Z'

  describe('formatDateConsistent', () => {
    it('formats date in DD/MM/YYYY format', () => {
      const result = formatDateConsistent(testDate)
      expect(result).toBe('15/03/2024')
    })

    it('handles single digit day and month correctly', () => {
      const result = formatDateConsistent('2024-03-05T10:30:00Z')
      expect(result).toBe('05/03/2024')
    })

    it('handles different months', () => {
      const result = formatDateConsistent(testDate2)
      expect(result).toBe('01/12/2024')
    })

    it('uses UTC to ensure consistency', () => {
      // Test with a date that would be different in different timezones
      const result = formatDateConsistent('2024-01-01T00:00:00Z')
      expect(result).toBe('01/01/2024')
    })
  })

  describe('formatDateWithMonthName', () => {
    it('formats date with month name', () => {
      const result = formatDateWithMonthName(testDate)
      expect(result).toBe('15 Mar 2024')
    })

    it('handles different months correctly', () => {
      const result = formatDateWithMonthName(testDate2)
      expect(result).toBe('1 Dec 2024')
    })

    it('handles all months of the year', () => {
      const testCases = [
        ['2024-01-15T10:30:00Z', '15 Jan 2024'],
        ['2024-02-15T10:30:00Z', '15 Feb 2024'],
        ['2024-03-15T10:30:00Z', '15 Mar 2024'],
        ['2024-04-15T10:30:00Z', '15 Apr 2024'],
        ['2024-05-15T10:30:00Z', '15 May 2024'],
        ['2024-06-15T10:30:00Z', '15 Jun 2024'],
        ['2024-07-15T10:30:00Z', '15 Jul 2024'],
        ['2024-08-15T10:30:00Z', '15 Aug 2024'],
        ['2024-09-15T10:30:00Z', '15 Sep 2024'],
        ['2024-10-15T10:30:00Z', '15 Oct 2024'],
        ['2024-11-15T10:30:00Z', '15 Nov 2024'],
        ['2024-12-15T10:30:00Z', '15 Dec 2024']
      ]

      testCases.forEach(([input, expected]) => {
        expect(formatDateWithMonthName(input)).toBe(expected)
      })
    })
  })

  describe('formatDateForCard', () => {
    it('returns the same format as formatDateWithMonthName', () => {
      const result1 = formatDateForCard(testDate)
      const result2 = formatDateWithMonthName(testDate)
      expect(result1).toBe(result2)
      expect(result1).toBe('15 Mar 2024')
    })
  })

  describe('formatDateForArticle', () => {
    it('returns the same format as formatDateWithMonthName', () => {
      const result1 = formatDateForArticle(testDate)
      const result2 = formatDateWithMonthName(testDate)
      expect(result1).toBe(result2)
      expect(result1).toBe('15 Mar 2024')
    })
  })

  describe('edge cases', () => {
    it('handles leap year dates', () => {
      const result = formatDateConsistent('2024-02-29T10:30:00Z')
      expect(result).toBe('29/02/2024')
    })

    it('handles year boundaries', () => {
      const startOfYear = formatDateConsistent('2024-01-01T00:00:00Z')
      const endOfYear = formatDateConsistent('2024-12-31T23:59:59Z')
      
      expect(startOfYear).toBe('01/01/2024')
      expect(endOfYear).toBe('31/12/2024')
    })

    it('handles invalid date strings gracefully', () => {
      // Note: Invalid dates create Date objects that return NaN for methods
      const result = formatDateConsistent('invalid-date')
      expect(result).toBe('NaN/NaN/NaN')
    })
  })
})
