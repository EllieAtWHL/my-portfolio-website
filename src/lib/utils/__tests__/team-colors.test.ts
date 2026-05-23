import { describe, it, expect } from '@jest/globals';
import { getTeamColor } from '../team-colors';

describe('Team Colors Utils', () => {
  describe('getTeamColor', () => {
    it('should return default gray for undefined color', () => {
      expect(getTeamColor()).toBe('#6b7280');
    });

    it('should return default gray for empty string', () => {
      expect(getTeamColor('')).toBe('#6b7280');
    });

    it('should return default gray for unknown color', () => {
      expect(getTeamColor('unknown-color')).toBe('#6b7280');
    });

    it('should return correct color for base colors', () => {
      expect(getTeamColor('white')).toBe('#f3f4f6');
      expect(getTeamColor('black')).toBe('#000000');
      expect(getTeamColor('red')).toBe('#ef4444');
      expect(getTeamColor('blue')).toBe('#3b82f6');
      expect(getTeamColor('green')).toBe('#10b981');
      expect(getTeamColor('yellow')).toBe('#eab308');
      expect(getTeamColor('purple')).toBe('#a855f7');
      expect(getTeamColor('pink')).toBe('#ec4899');
      expect(getTeamColor('orange')).toBe('#f97316');
      expect(getTeamColor('cyan')).toBe('#06b6d4');
      expect(getTeamColor('teal')).toBe('#14b8a6');
      expect(getTeamColor('indigo')).toBe('#6366f1');
      expect(getTeamColor('lime')).toBe('#84cc16');
      expect(getTeamColor('amber')).toBe('#f59e0b');
      expect(getTeamColor('emerald')).toBe('#10b981');
      expect(getTeamColor('rose')).toBe('#f43f5e');
      expect(getTeamColor('violet')).toBe('#8b5cf6');
      expect(getTeamColor('fuchsia')).toBe('#d946ef');
      expect(getTeamColor('sky')).toBe('#0ea5e9');
      expect(getTeamColor('stone')).toBe('#78716c');
      expect(getTeamColor('neutral')).toBe('#737373');
      expect(getTeamColor('zinc')).toBe('#71717a');
    });

    it('should return correct color for red variants', () => {
      expect(getTeamColor('red-50')).toBe('#fef2f2');
      expect(getTeamColor('red-100')).toBe('#fee2e2');
      expect(getTeamColor('red-200')).toBe('#fecaca');
      expect(getTeamColor('red-300')).toBe('#fca5a5');
      expect(getTeamColor('red-400')).toBe('#f87171');
      expect(getTeamColor('red-500')).toBe('#ef4444');
      expect(getTeamColor('red-600')).toBe('#dc2626');
      expect(getTeamColor('red-700')).toBe('#b91c1c');
      expect(getTeamColor('red-800')).toBe('#991b1b');
      expect(getTeamColor('red-900')).toBe('#7f1d1d');
    });

    it('should return correct color for blue variants', () => {
      expect(getTeamColor('blue-50')).toBe('#eff6ff');
      expect(getTeamColor('blue-100')).toBe('#dbeafe');
      expect(getTeamColor('blue-200')).toBe('#bfdbfe');
      expect(getTeamColor('blue-300')).toBe('#93c5fd');
      expect(getTeamColor('blue-400')).toBe('#60a5fa');
      expect(getTeamColor('blue-500')).toBe('#3b82f6');
      expect(getTeamColor('blue-600')).toBe('#2563eb');
      expect(getTeamColor('blue-700')).toBe('#1d4ed8');
      expect(getTeamColor('blue-800')).toBe('#1e40af');
      expect(getTeamColor('blue-900')).toBe('#1e3a8a');
    });

    it('should return correct color for green variants', () => {
      expect(getTeamColor('green-50')).toBe('#f0fdf4');
      expect(getTeamColor('green-100')).toBe('#dcfce7');
      expect(getTeamColor('green-200')).toBe('#bbf7d0');
      expect(getTeamColor('green-300')).toBe('#86efac');
      expect(getTeamColor('green-400')).toBe('#4ade80');
      expect(getTeamColor('green-500')).toBe('#22c55e');
      expect(getTeamColor('green-600')).toBe('#16a34a');
      expect(getTeamColor('green-700')).toBe('#15803d');
      expect(getTeamColor('green-800')).toBe('#166534');
      expect(getTeamColor('green-900')).toBe('#14532d');
    });

    it('should return correct color for gray variants', () => {
      expect(getTeamColor('gray-50')).toBe('#f9fafb');
      expect(getTeamColor('gray-100')).toBe('#f3f4f6');
      expect(getTeamColor('gray-200')).toBe('#e5e7eb');
      expect(getTeamColor('gray-300')).toBe('#d1d5db');
      expect(getTeamColor('gray-400')).toBe('#9ca3af');
      expect(getTeamColor('gray-500')).toBe('#6b7280');
      expect(getTeamColor('gray-600')).toBe('#4b5563');
      expect(getTeamColor('gray-700')).toBe('#374151');
      expect(getTeamColor('gray-800')).toBe('#1f2937');
      expect(getTeamColor('gray-900')).toBe('#111827');
    });

    it('should return correct color for slate variants', () => {
      expect(getTeamColor('slate-50')).toBe('#f8fafc');
      expect(getTeamColor('slate-100')).toBe('#f1f5f9');
      expect(getTeamColor('slate-200')).toBe('#e2e8f0');
      expect(getTeamColor('slate-300')).toBe('#cbd5e1');
      expect(getTeamColor('slate-400')).toBe('#94a3b8');
      expect(getTeamColor('slate-500')).toBe('#64748b');
      expect(getTeamColor('slate-600')).toBe('#475569');
      expect(getTeamColor('slate-700')).toBe('#334155');
      expect(getTeamColor('slate-800')).toBe('#1e293b');
      expect(getTeamColor('slate-900')).toBe('#0f172a');
    });

    it('should be case sensitive', () => {
      expect(getTeamColor('red')).toBe('#ef4444');
      expect(getTeamColor('Red')).toBe('#6b7280');
      expect(getTeamColor('RED')).toBe('#6b7280');
    });

    it('should handle color names with special characters', () => {
      expect(getTeamColor('red-500')).toBe('#ef4444');
      expect(getTeamColor('blue-600')).toBe('#2563eb');
      expect(getTeamColor('green-700')).toBe('#15803d');
    });
  });
});
