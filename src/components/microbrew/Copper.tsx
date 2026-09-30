'use client';

import type { TokenType } from '@/lib/microbrew/data';
import {
  getNeighbours,
  sameSlot,
  slotHeight,
  type Copper as CopperState,
  type CopperSlot,
  type CopperToken,
} from '@/lib/microbrew/copper';
import { cn } from '@/lib/utils';

// The Copper board: staggered columns of hexagonal tokens joined by the
// diagonal lines tokens may swap along (see src/lib/microbrew/copper.ts).
// Lines are drawn in an SVG underneath; tokens are absolutely positioned
// buttons on top so they keep native button/keyboard behaviour.

const HEX_WIDTH = 48;
const HEX_HEIGHT = 42; // ~ width * sqrt(3)/2: a flat-topped regular hexagon
const COLUMN_SPACING = 60;
const HEIGHT_UNIT = 28; // vertical distance per unit of slotHeight (half a slot)

// Flat-topped hexagon, matching the printed tokens.
const HEX_POINTS = '12,1 36,1 47,21 36,41 12,41 1,21';

const TOKEN_FILL: Record<TokenType, string> = {
  yellow: 'fill-yellow-300 stroke-yellow-600',
  orange: 'fill-orange-400 stroke-orange-700',
  brown: 'fill-amber-800 stroke-amber-500',
  hops: 'fill-green-600 stroke-green-900',
};

const TOKEN_LETTER_FILL: Record<TokenType, string> = {
  yellow: 'fill-yellow-950',
  orange: 'fill-orange-950',
  brown: 'fill-amber-50',
  hops: 'fill-green-50',
};

// A letter on each token so they don't rely on colour alone.
const TOKEN_LETTER: Record<TokenType, string> = { yellow: 'Y', orange: 'O', brown: 'B', hops: 'H' };

export const TOKEN_LABELS: Record<TokenType, string> = {
  yellow: 'light malt',
  orange: 'medium malt',
  brown: 'dark malt',
  hops: 'hops',
};

const tokenLabel = (token: CopperToken) => (token ? TOKEN_LABELS[token] : 'empty');

/** A small hexagon for token lists on cards (recipes, customers). */
export function TokenChip({ token, className }: { token: TokenType; className?: string }) {
  return (
    <svg
      role="img"
      aria-label={TOKEN_LABELS[token]}
      viewBox="0 0 48 42"
      className={cn('inline-block w-4 h-3.5', className)}
    >
      <title>{TOKEN_LABELS[token]}</title>
      <polygon points={HEX_POINTS} strokeWidth={4} className={TOKEN_FILL[token]} />
    </svg>
  );
}

function HexToken({ token, selected, target }: { token: CopperToken; selected: boolean; target: boolean }) {
  return (
    <svg viewBox="0 0 48 42" width={HEX_WIDTH} height={HEX_HEIGHT} aria-hidden="true" className="overflow-visible">
      {token ? (
        <>
          <polygon points={HEX_POINTS} strokeWidth={3} className={TOKEN_FILL[token]} />
          <text
            x="24"
            y="22"
            textAnchor="middle"
            dominantBaseline="central"
            className={cn('text-sm font-bold select-none', TOKEN_LETTER_FILL[token])}
          >
            {TOKEN_LETTER[token]}
          </text>
        </>
      ) : (
        <polygon
          points={HEX_POINTS}
          strokeWidth={2}
          strokeDasharray="4 3"
          className="fill-transparent stroke-gray-400 dark:stroke-gray-500"
        />
      )}
      {selected && (
        <polygon points={HEX_POINTS} strokeWidth={4} className="fill-transparent stroke-sky-500" transform="scale(1.12) translate(-2.6 -2.2)" />
      )}
      {target && (
        <polygon
          points={HEX_POINTS}
          strokeWidth={3}
          strokeDasharray="6 4"
          className="fill-transparent stroke-sky-500 motion-safe:animate-pulse"
          transform="scale(1.12) translate(-2.6 -2.2)"
        />
      )}
    </svg>
  );
}

interface CopperProps {
  copper: CopperState;
  label: string;
  /** When provided, each slot is a button; `isSlotEnabled` decides which are clickable. */
  onSlotClick?: (slot: CopperSlot) => void;
  isSlotEnabled?: (slot: CopperSlot) => boolean;
  /** The token currently picked (e.g. the one being brewed). */
  selectedSlot?: CopperSlot | null;
  /** Legal destinations for the selected token, highlighted on the board. */
  targetSlots?: CopperSlot[];
}

export function Copper({ copper, label, onSlotClick, isSlotEnabled, selectedSlot, targetSlots = [] }: CopperProps) {
  const slots: CopperSlot[] = copper.flatMap((column, c) => column.map((_, s) => ({ column: c, slot: s })));
  const maxHeight = Math.max(...slots.map(slotHeight));
  const centre = (slot: CopperSlot) => ({
    x: slot.column * COLUMN_SPACING + HEX_WIDTH / 2,
    y: (maxHeight - slotHeight(slot)) * HEIGHT_UNIT + HEX_HEIGHT / 2,
  });
  const width = (copper.length - 1) * COLUMN_SPACING + HEX_WIDTH;
  const height = maxHeight * HEIGHT_UNIT + HEX_HEIGHT;

  // Each line once: only draw to neighbours in the column to the right.
  const lines = slots.flatMap((from) =>
    getNeighbours(copper, from)
      .filter((to) => to.column > from.column)
      .map((to) => ({ from: centre(from), to: centre(to), key: `${from.column}-${from.slot}-${to.column}-${to.slot}` })),
  );

  return (
    <div role="group" aria-label={label} className="relative mx-auto" style={{ width, height }}>
      <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
        {lines.map(({ from, to, key }) => (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-gray-400 dark:stroke-gray-500"
          />
        ))}
      </svg>
      {slots.map((slot) => {
        const token = copper[slot.column][slot.slot];
        const { x, y } = centre(slot);
        const selected = !!selectedSlot && sameSlot(selectedSlot, slot);
        const target = targetSlots.some((t) => sameSlot(t, slot));
        const description = `Column ${slot.column + 1}, slot ${slot.slot + 1} from the bottom: ${tokenLabel(token)}`;
        const position = { left: x - HEX_WIDTH / 2, top: y - HEX_HEIGHT / 2, width: HEX_WIDTH, height: HEX_HEIGHT };
        const key = `${slot.column}-${slot.slot}`;

        if (!onSlotClick) {
          return (
            <span key={key} role="img" aria-label={description} className="absolute" style={position}>
              <HexToken token={token} selected={selected} target={target} />
            </span>
          );
        }
        const enabled = isSlotEnabled ? isSlotEnabled(slot) : true;
        return (
          <button
            key={key}
            type="button"
            aria-label={description}
            aria-pressed={selected}
            disabled={!enabled}
            onClick={() => onSlotClick(slot)}
            className={cn(
              'absolute p-0 bg-transparent border-0 rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              enabled ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              // While a token is picked, mute everything it can't swap with so the targets stand out
              // (muted tokens may still be clickable, e.g. to change the pick). A filter, not
              // opacity: translucent tokens would let the lines show through.
              selectedSlot && !selected && !target && 'saturate-[.15] brightness-110 dark:brightness-75',
            )}
            style={position}
          >
            <HexToken token={token} selected={selected} target={target} />
          </button>
        );
      })}
    </div>
  );
}
