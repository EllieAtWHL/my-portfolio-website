import { PlayerWithStats } from '@/lib/data/players';

interface PlayerCardProps {
  player: PlayerWithStats;
  teamColor?: string;
  showStats?: boolean;
}

export default function PlayerCard({ player, teamColor = 'gray', showStats = true }: PlayerCardProps) {
  const fullName = `${player.first_name || ''} ${player.last_name}`.trim();
  const stats = player.player_stats;

  const getPositionDisplay = (position: string | null) => {
    if (!position) return '—';
    return position.toUpperCase();
  };

  const getMinutesDisplay = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return '—';
    return minutes.toString();
  };

  const getRatingDisplay = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return '—';
    return rating.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {player.profile_image_url ? (
              <img
                src={player.profile_image_url}
                alt={fullName}
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ '--team-color': teamColor, borderColor: 'var(--team-color)' } as React.CSSProperties}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm border-2"
                style={{ '--team-color': teamColor, backgroundColor: 'var(--team-color)', borderColor: 'var(--team-color)' } as React.CSSProperties}
              >
                {player.last_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{fullName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                  {getPositionDisplay(player.position)}
                </span>
                {player.nationality && (
                  <span className="text-xs">{player.nationality}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="text-right">
            {stats.player_of_the_match && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mb-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                POTM
              </div>
            )}
            {stats.player_rating && (
              <div className="text-lg font-bold text-gray-900">
                {getRatingDisplay(stats.player_rating)}
              </div>
            )}
          </div>
        )}
      </div>

      {showStats && stats && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.goals}
              </div>
              <div className="text-gray-500 text-xs">Goals</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.assists}
              </div>
              <div className="text-gray-500 text-xs">Assists</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {getMinutesDisplay(stats.minutes_played)}
              </div>
              <div className="text-gray-500 text-xs">Minutes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.yellow_cards + stats.red_cards * 2}
              </div>
              <div className="text-gray-500 text-xs">Cards</div>
            </div>
          </div>

          {/* Additional stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-3">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.shots}
              </div>
              <div className="text-gray-500 text-xs">Shots</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.shots_on_target}
              </div>
              <div className="text-gray-500 text-xs">On Target</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.passes_completed || '—'}
              </div>
              <div className="text-gray-500 text-xs">Passes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {stats.tackles || '—'}
              </div>
              <div className="text-gray-500 text-xs">Tackles</div>
            </div>
          </div>

          {/* Match participation indicators */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {stats.started && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Starter
              </span>
            )}
            {stats.was_substitute && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                </svg>
                Sub
              </span>
            )}
            {stats.was_unused_substitute && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/>
                </svg>
                Bench
              </span>
            )}
            {stats.minute_on && (
              <span className="text-xs text-gray-500">
                {stats.minute_on}&apos;{stats.minute_off ? ` - ${stats.minute_off}&apos;` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
