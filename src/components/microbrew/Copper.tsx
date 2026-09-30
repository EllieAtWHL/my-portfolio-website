'use client';

import { COPPER_RAISED_COLUMNS, type TokenType } from '@/lib/microbrew/data';
import type { Copper as CopperState, CopperSlot } from '@/lib/microbrew/game';
import { cn } from '@/lib/utils';

// Placeholder Copper view for setup (WEB-179). WEB-180 builds the real board
// and the Brew puzzle on top of this layout.

const TOKEN_STYLES: Record<TokenType, string> = {
  yellow: 'bg-yellow-300 border-yellow-500',
  orange: 'bg-orange-400 border-orange-600',
  // Lighter border than the fill so dark malts stay visible on the dark theme.
  brown: 'bg-amber-800 border-amber-600',
  hops: 'bg-green-600 border-green-800',
};

export const TOKEN_LABELS: Record<TokenType, string> = {
  yellow: 'light malt',
  orange: 'medium malt',
  brown: 'dark malt',
  hops: 'hops',
};

export function TokenChip({ token, className }: { token: TokenType; className?: string }) {
  return (
    <span
      role="img"
      aria-label={TOKEN_LABELS[token]}
      title={TOKEN_LABELS[token]}
      className={cn('inline-block w-4 h-4 rounded-full border-2', TOKEN_STYLES[token], className)}
    />
  );
}

interface CopperProps {
  copper: CopperState;
  /** When provided, malt slots become buttons (hops can't be picked). */
  onSelectSlot?: (slot: CopperSlot) => void;
  label: string;
}

/**
 * 4 columns, each drawn bottom (slot 0) to top. Columns 1 and 3 sit half a
 * slot higher than columns 2 and 4, like the physical Copper.
 */
export function Copper({ copper, onSelectSlot, label }: CopperProps) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-2 pt-6">
      {copper.map((column, c) => (
        <div
          key={c}
          className={cn('flex flex-col-reverse gap-2', COPPER_RAISED_COLUMNS.includes(c) && '-translate-y-6')}
        >
          {column.map((token, s) => {
            const tokenClassName = cn('w-10 h-10 rounded-full border-4', TOKEN_STYLES[token]);
            const description = `Column ${c + 1}, slot ${s + 1} from the bottom: ${TOKEN_LABELS[token]}`;
            if (!onSelectSlot) {
              return <span key={s} role="img" aria-label={description} className={tokenClassName} />;
            }
            return (
              <button
                key={s}
                type="button"
                aria-label={`Replace with hops - ${description}`}
                disabled={token === 'hops'}
                onClick={() => onSelectSlot({ column: c, slot: s })}
                className={cn(
                  tokenClassName,
                  'cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:hover:scale-100',
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
