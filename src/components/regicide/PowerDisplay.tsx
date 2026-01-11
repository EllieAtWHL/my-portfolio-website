'use client';

interface PowerDisplayProps {
  type: 'royal' | 'player';
  power: number;
}

export function PowerDisplay({ type, power }: PowerDisplayProps) {
  const getPowerColor = (type: string) => {
    switch (type) {
      case 'royal': return 'from-purple-500 to-purple-700';
      case 'player': return 'from-blue-500 to-blue-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getPowerIcon = (type: string) => {
    switch (type) {
      case 'royal': return '⚔️';
      case 'player': return '🛡️';
      default: return '⚡';
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
      <div className="text-2xl">
        {getPowerIcon(type)}
      </div>
      <div className="text-white">
        <div className="text-sm text-white/70 capitalize">{type} Power</div>
        <div className="text-2xl font-bold">{power}</div>
      </div>
      <div className={`w-2 h-8 bg-gradient-to-b ${getPowerColor(type)} rounded-full`} />
    </div>
  );
}
