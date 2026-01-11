'use client';

interface CardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  power: number;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function Card({ suit, rank, power, onClick, isSelected = false, className = '' }: CardProps) {
  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900';
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative w-20 h-28 bg-white rounded-lg shadow-lg border-2 border-gray-300
        flex flex-col items-center justify-center cursor-pointer
        transform transition-all duration-200
        ${isSelected ? 'border-blue-500 shadow-blue-500/50 scale-105 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'}
        ${className}
      `}
    >
      {/* Card Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Rank */}
      <div className={`text-2xl font-bold ${getSuitColor(suit)} mb-1`}>
        {rank}
      </div>

      {/* Suit */}
      <div className={`text-3xl ${getSuitColor(suit)}`}>
        {getSuitSymbol(suit)}
      </div>

      {/* Power Indicator */}
      <div className="absolute top-1 right-1 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700">{power}</span>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}
