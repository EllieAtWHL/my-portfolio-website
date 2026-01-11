'use client';

interface DeckProps {
  type: 'royal' | 'tavern' | 'player';
  count: number;
  className?: string;
}

export function Deck({ type, count, className = '' }: DeckProps) {
  const getDeckColor = (type: string) => {
    switch (type) {
      case 'royal': return 'from-purple-600 to-purple-800';
      case 'tavern': return 'from-amber-600 to-amber-800';
      case 'player': return 'from-blue-600 to-blue-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getDeckIcon = (type: string) => {
    switch (type) {
      case 'royal': return '👑';
      case 'tavern': return '🍺';
      case 'player': return '🎴';
      default: return '📦';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Card Stack */}
      <div className="relative">
        {/* Shadow cards for depth effect */}
        {[1, 2, 3].map((offset) => (
          <div
            key={offset}
            className={`
              absolute w-20 h-28 bg-gradient-to-br ${getDeckColor(type)}
              rounded-lg shadow-lg border border-white/20
              transform transition-transform duration-200
            `}
            style={{
              top: `${offset * 2}px`,
              left: `${offset * 2}px`,
              zIndex: 3 - offset
            }}
          />
        ))}
        
        {/* Main deck card */}
        <div
          className={`
            relative w-20 h-28 bg-gradient-to-br ${getDeckColor(type)}
            rounded-lg shadow-xl border-2 border-white/30
            flex flex-col items-center justify-center
            transform transition-all duration-200 hover:scale-105
            cursor-pointer
          `}
        >
          {/* Deck Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Deck Icon */}
          <div className="text-3xl mb-1">
            {getDeckIcon(type)}
          </div>

          {/* Card Count */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-bold">{count}</span>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}
