import { PlayerWithStats } from '@/lib/data/players';

interface PlayerRowProps {
  player: PlayerWithStats;
}

export default function PlayerRow({ player }: PlayerRowProps) {
  const fullName = `${player.first_name || ''} ${player.last_name}`.trim();
  const stats = player.player_stats;
  
  const getJerseyNumber = () => {
    // This would come from player_history table
    // Return null to hide jersey number column if no number is available
    return null;
  };

  const getParticipationIcon = () => {
    if (!stats) return null;
    
    if (stats.started) {
      return (
        <div className="w-2 h-2 bg-[#78BEE8] rounded-full" title="Started" />
      );
    } else if (stats.was_substitute) {
      return (
        <div className="w-2 h-2 bg-[#78BEE8] rounded-full" title="Substitute" />
      );
    } else if (stats.was_unused_substitute) {
      return (
        <div className="w-2 h-2 bg-[#94a3b8] rounded-full" title="Unused Substitute" />
      );
    }
    return null;
  };

  const getQuickStats = () => {
    if (!stats) return '';
    const goals = stats.goals || 0;
    const assists = stats.assists || 0;
    const rating = stats.player_rating ? stats.player_rating.toFixed(1) : '';
    
    const parts = [];
    if (goals > 0) parts.push(`${goals} ⚽️`);
    if (assists > 0) parts.push(`${assists} 👟`);
    if (rating) parts.push(rating);
    
    // Add substitution minutes if player was subbed on or off
    if (stats.minute_on && stats.was_substitute) {
      parts.push(`→ ${stats.minute_on}'`);
    }
    if (stats.minute_off && (stats.started || stats.was_substitute)) {
      parts.push(`← ${stats.minute_off}'`);
    }
    
    return parts.join(' • ');
  };

  return (
    <div
      className="flex items-center gap-3 p-3 border-b border-gray-200 last:border-b-0"
    >
      {getJerseyNumber() && (
        <div className="w-8 text-center font-mono text-sm text-[#f5f7fa]">
          {getJerseyNumber()}
        </div>
      )}

      {/* Participation Indicator */}
      <div className="w-4 flex items-center justify-center">
        {getParticipationIcon()}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#f5f7fa] truncate">{fullName}</div>
        <div className="text-sm text-[#78BEE8] truncate">
          {player.preferred_position || '—'} • {player.nationality || '—'}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="text-sm text-[#f5f7fa] text-right min-w-0">
        {getQuickStats()}
      </div>

      {/* Player of Match Badge */}
      {stats?.player_of_the_match && (
        <div className="ml-2">
          <div className="w-6 h-6 bg-[#78BEE8] rounded-full flex items-center justify-center" title="Player of Match">
            <svg className="w-3 h-3 text-[#081521]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
