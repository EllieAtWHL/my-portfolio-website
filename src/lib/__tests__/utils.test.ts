import { cn } from '../utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('handles conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'additional-class')
      expect(result).toBe('base-class additional-class')
    })

    it('handles empty strings', () => {
      const result = cn('base-class', '', 'additional-class')
      expect(result).toBe('base-class additional-class')
    })

    it('handles arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('handles objects with boolean values', () => {
      const result = cn({
        'px-4': true,
        'py-2': true,
        'hidden': false
      })
      expect(result).toBe('px-4 py-2')
    })

    it('merges Tailwind classes correctly (conflict resolution)', () => {
      const result = cn('px-4', 'px-8')
      expect(result).toBe('px-8') // Later class should override earlier
    })

    it('handles complex mixed inputs', () => {
      const result = cn(
        'base-class',
        {
          'px-4': true,
          'py-2': false,
          'bg-blue-500': true
        },
        ['text-white', 'font-bold'],
        undefined,
        'rounded'
      )
      expect(result).toBe('base-class px-4 bg-blue-500 text-white font-bold rounded')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles single class', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('handles conflicting Tailwind utilities', () => {
      const result = cn('text-sm', 'text-lg', 'text-xl')
      expect(result).toBe('text-xl') // Should keep the last conflicting class
    })

    it('handles non-conflicting Tailwind utilities', () => {
      const result = cn('text-sm', 'font-bold', 'text-blue-500')
      expect(result).toBe('text-sm font-bold text-blue-500')
    })

    it('handles responsive prefixes', () => {
      const result = cn('px-4', 'md:px-8', 'lg:px-12')
      expect(result).toBe('px-4 md:px-8 lg:px-12')
    })

    it('handles state variants', () => {
      const result = cn('px-4', 'hover:px-8', 'focus:outline-none')
      expect(result).toBe('px-4 hover:px-8 focus:outline-none')
    })

    it('handles complex real-world scenario', () => {
      const isActive = true
      const size = 'large'
      
      const result = cn(
        'base-button-styles',
        'transition-colors',
        {
          'bg-blue-500': isActive,
          'bg-gray-300': !isActive,
          'px-4 py-2': size === 'small',
          'px-8 py-4': size === 'large'
        },
        isActive && 'text-white'
      )
      
      expect(result).toBe('base-button-styles transition-colors bg-blue-500 px-8 py-4 text-white')
    })
  })
})
