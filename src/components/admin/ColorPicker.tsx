import { useState } from 'react';
import { getTeamColor } from '@/lib/utils/team-colors';
import { Button } from '@/components/Button';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

const TAILWIND_COLORS = [
  { name: 'slate', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'gray', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'zinc', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'neutral', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'stone', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'red', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'orange', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'amber', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'yellow', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'lime', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'green', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'emerald', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'teal', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'cyan', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'sky', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'blue', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'indigo', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'violet', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'purple', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'fuchsia', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'pink', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'rose', colors: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} <span className="text-gray-400">(optional)</span>
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded border border-gray-600 flex items-center justify-center hover:border-gray-500 transition-colors"
          style={{ backgroundColor: getTeamColor(value || undefined) }}
        >
          {!value && <span className="text-gray-400 text-xs">None</span>}
        </button>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="e.g., blue-500"
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-600">
              <span className="text-lg font-medium spurs-text">Select a Color</span>
              <Button
                variant="spurs"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-4">
                {TAILWIND_COLORS.map(({ name, colors }) => (
                  <div key={name}>
                    <div className="text-sm font-medium text-gray-300 mb-2 capitalize">{name}</div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((shade) => {
                        const colorValue = `${name}-${shade}`;
                        return (
                          <button
                            key={shade}
                            type="button"
                            onClick={() => {
                              onChange(colorValue);
                              setIsOpen(false);
                            }}
                            className="w-10 h-10 rounded border border-gray-600 hover:scale-110 transition-transform flex items-center justify-center"
                            style={{ backgroundColor: getTeamColor(colorValue) }}
                            title={colorValue}
                          >
                            <span className="text-xs text-gray-900/50">{shade}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-600 flex justify-between gap-4">
              <Button
                variant="spurs"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
              >
                Clear Selection
              </Button>
              <Button
                variant="spurs"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
