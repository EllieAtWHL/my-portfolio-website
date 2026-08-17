'use client';

interface CardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  showValue?: boolean;
}

interface PipPosition {
  row: number;
  col: number;
  rotate?: boolean;
}

// Traditional playing-card pip arrangement, keyed by numeric rank (2-10).
// Positions are (row, col) in a 3-column x 8-row grid, where each pip spans
// 2 rows - matching the classic pip layout used on real playing cards.
const PIP_LAYOUTS: Record<number, PipPosition[]> = {
  2: [{ row: 1, col: 2 }, { row: 7, col: 2, rotate: true }],
  3: [{ row: 1, col: 2 }, { row: 4, col: 2 }, { row: 7, col: 2, rotate: true }],
  4: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  5: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 4, col: 2 },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  6: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 4, col: 1 }, { row: 4, col: 3 },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  7: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 4, col: 1 }, { row: 4, col: 3 },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  8: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 4, col: 1 }, { row: 4, col: 3 },
    { row: 6, col: 2, rotate: true },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  9: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 3, col: 1 }, { row: 3, col: 3 },
    { row: 4, col: 2 },
    { row: 5, col: 1, rotate: true }, { row: 5, col: 3, rotate: true },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
  10: [
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 3, col: 1 }, { row: 3, col: 3 },
    { row: 5, col: 1, rotate: true }, { row: 5, col: 3, rotate: true },
    { row: 6, col: 2, rotate: true },
    { row: 7, col: 1, rotate: true }, { row: 7, col: 3, rotate: true },
  ],
};

const RANK_NAME: Record<string, string> = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
// Royals' combat value isn't obvious from the letter alone (unlike A=1 or a numbered
// card matching its own pip count), so it gets its own badge - top-right is free for
// J/Q/K since they don't use the pip grid.
const ROYAL_VALUE: Record<string, number> = { J: 10, Q: 15, K: 20 };

// Same suit icon assets as the original vanilla-JS implementation
// (public/regicide/heart.svg etc., copied over unmodified from the original
// site's imgs/ folder) - rendered the same way it was there: a square box
// with background-size: cover, just scaled up to this card's larger size.
const SUIT_ICON_SRC: Record<CardProps['suit'], string> = {
  hearts: '/regicide/heart.svg',
  spades: '/regicide/spade.svg',
  diamonds: '/regicide/diamond.svg',
  clubs: '/regicide/club.svg',
};

// Original site had dedicated Jack/Queen/King artwork (public/regicide/jack-red.svg
// etc.) rather than reusing the plain suit icon for royals - a red or black variant
// depending on suit, same as the plain suit icons.
const FACE_ICON_SRC: Record<'J' | 'Q' | 'K', Record<'red' | 'black', string>> = {
  J: { red: '/regicide/jack-red.svg', black: '/regicide/jack-black.svg' },
  Q: { red: '/regicide/queen-red.svg', black: '/regicide/queen-black.svg' },
  K: { red: '/regicide/king-red.svg', black: '/regicide/king-black.svg' },
};

function PipImage({ src, className }: { src: string; className?: string }) {
  return (
    <div
      className={`bg-cover bg-center bg-no-repeat ${className ?? ''}`}
      style={{ backgroundImage: `url(${src})` }}
      aria-hidden="true"
    />
  );
}

function SuitIcon({ suit, className }: { suit: CardProps['suit']; className?: string }) {
  return <PipImage src={SUIT_ICON_SRC[suit]} className={className} />;
}

export function Card({ suit, rank, onClick, isSelected = false, className = '', showValue = false }: CardProps) {
  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const suitColor = getSuitColor(suit);
  const rankLabel = RANK_NAME[rank] ?? rank;
  const suitLabel = suit.charAt(0).toUpperCase() + suit.slice(1);
  const pips = PIP_LAYOUTS[Number(rank)];
  const royalValue = ROYAL_VALUE[rank];
  const faceIconSrc = FACE_ICON_SRC[rank as 'J' | 'Q' | 'K']?.[
    suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black'
  ];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`${rankLabel} of ${suitLabel}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={`
        relative w-28 h-40 bg-white rounded-lg shadow-lg border-2 border-gray-300
        flex flex-col items-center justify-center
        transform transition-all duration-200
        card-focusable
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/50' : ''}
        ${className}
      `}
    >
      {/* Card Background Pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div
          className="w-full h-full bg-repeat"
          style={{
            '--pattern-image': `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundImage: 'var(--pattern-image)',
            backgroundSize: '20px 20px'
          } as React.CSSProperties}
        />
      </div>

      {/* Corner rank + suit, top-left and mirrored bottom-right */}
      <div className={`absolute top-0.5 left-0.5 flex flex-col items-center text-base font-bold leading-none ${suitColor}`} aria-hidden="true">
        <span>{rank}</span>
        <SuitIcon suit={suit} className="w-3 h-3 -mt-px" />
      </div>
      <div className={`absolute bottom-0.5 right-0.5 flex flex-col items-center text-base font-bold leading-none rotate-180 ${suitColor}`} aria-hidden="true">
        <span>{rank}</span>
        <SuitIcon suit={suit} className="w-3 h-3 -mt-px" />
      </div>

      {/* Card Face */}
      {pips ? (
        <div className="grid grid-cols-3 grid-rows-[repeat(8,minmax(0,1fr))] w-full h-full px-4 py-4" aria-hidden="true">
          {pips.map((pip, index) => (
            <span
              key={index}
              className="flex items-center justify-center"
              style={{
                gridRowStart: pip.row,
                gridRowEnd: 'span 2',
                gridColumnStart: pip.col,
                transform: pip.rotate ? 'rotate(180deg)' : undefined,
              }}
            >
              <SuitIcon suit={suit} className="w-6 h-6" />
            </span>
          ))}
        </div>
      ) : rank === 'A' ? (
        <SuitIcon suit={suit} className="w-14 h-14" />
      ) : faceIconSrc ? (
        <PipImage src={faceIconSrc} className="w-16 h-16" />
      ) : null}

      {/* Royal combat value - only relevant while the card is in your hand */}
      {showValue && royalValue !== undefined && (
        <div className="absolute top-1.5 right-1.5 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">{royalValue}</span>
        </div>
      )}
    </div>
  );
}
