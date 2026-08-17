'use client';

interface DeckProps {
  type: 'royal' | 'tavern' | 'player';
  count: number;
  className?: string;
}

const DECK_LABEL: Record<DeckProps['type'], string> = {
  royal: 'Royal deck',
  tavern: 'Tavern draw pile',
  player: 'Player deck',
};

// A single traditional diamond-lattice card back, shared by every deck type -
// Regicide is played with one physical 52-card deck split into royals and
// tavern, so the backs should look identical rather than colour-coded per
// pile. Uses the site's own green brand palette rather than a generic
// red/blue Bicycle-style back.
const LATTICE_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--brand-primary-dark)',
  backgroundImage: `
    repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(134, 239, 172, 0.35) 7px, rgba(134, 239, 172, 0.35) 8px),
    repeating-linear-gradient(-45deg, transparent, transparent 7px, rgba(134, 239, 172, 0.35) 7px, rgba(134, 239, 172, 0.35) 8px)
  `,
};

export function Deck({ type, count, className = '' }: DeckProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Card Stack - scaled up slightly (not hover-gated, since decks aren't
          clickable) so the offset shadow layers behind the main card read
          clearly as "a stack of many cards" at rest. */}
      <div className="relative transform scale-105">
        {/* Shadow cards for depth effect */}
        {[1, 2].map((offset) => (
          <div
            key={offset}
            className="absolute w-28 h-40 rounded-lg border-2 border-[var(--accent-brand)] transform transition-transform duration-200"
            style={{
              ...LATTICE_STYLE,
              top: `${offset * 2}px`,
              left: `${offset * 2}px`,
              zIndex: -offset,
            }}
          />
        ))}

        {/* Main deck card */}
        <div
          role="img"
          aria-label={`${DECK_LABEL[type]}, ${count} cards remaining`}
          className="relative w-28 h-40 rounded-lg border-2 border-[var(--accent-brand)] flex items-center justify-center cursor-default overflow-hidden"
          style={LATTICE_STYLE}
        >
          {/* Inner frame - the double-border look of a traditional card back */}
          <div className="absolute inset-1.5 rounded border border-[var(--accent-brand)]/60 pointer-events-none" />

          {/* Card Count */}
          <div className="relative bg-[var(--brand-primary-darker)]/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-[var(--accent-brand)]/40">
            <span className="text-[var(--accent-brand)] text-sm font-bold">{count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
