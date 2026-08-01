'use client';

import Image from 'next/image';
import { PlayerWithStats } from '@/lib/data/players';

interface PlayerModalProps {
  player: PlayerWithStats | null;
  onClose: () => void;
  teamColor?: string;
}

// teamColor's default is intentionally a literal hex string, not a CSS
// variable reference (it matches --spurs-primary-dark) - it's concatenated
// with a hex alpha suffix below (teamColor + '10'), which only works for a
// literal hex value; `var(--spurs-primary-dark)` can't be suffixed the same way.
export default function PlayerModal({ player, onClose, teamColor = '#081521' }: PlayerModalProps) {
  if (!player) return null;

  const fullName = `${player.first_name || ''} ${player.last_name}`.trim();
  const stats = player.player_stats;

  const getStatDisplay = (value: number | null | undefined, suffix = '') => {
    return value !== null && value !== undefined ? `${value}${suffix}` : '—';
  };

  const getRatingColor = (rating: number | null | undefined) => {
    if (!rating) return 'text-slate-400';
    if (rating >= 8.0) return 'text-spurs-accent';
    if (rating >= 7.0) return 'text-spurs-accent';
    if (rating >= 6.0) return 'text-spurs-accent';
    return 'text-slate-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-spurs-light rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div 
          className="p-6 border-b border-slate-200"
          style={{ backgroundColor: teamColor + '10' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {player.profile_image_url ? (
                <Image
                  src={player.profile_image_url}
                  alt={fullName}
                  width={64}
                  height={64}
                  className="rounded-full border-2"
                  style={{ borderColor: teamColor }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2"
                  style={{ backgroundColor: teamColor, borderColor: teamColor }}
                >
                  {player.last_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-spurs-dark">{fullName}</h2>
                <div className="text-slate-500">
                  {player.position || '—'} • {player.nationality || '—'}
                </div>
                {player.height_cm && (
                  <div className="text-sm text-slate-400">
                    {player.height_cm}cm {player.weight_kg && `• ${player.weight_kg}kg`}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-spurs-dark transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {stats ? (
            <div className="space-y-6">
              {/* Match Participation */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-spurs-dark">Match Participation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {stats.started ? '✓' : '—'}
                    </div>
                    <div className="text-sm text-slate-500">Started</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.minutes_played)}
                    </div>
                    <div className="text-sm text-slate-500">Minutes</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {stats.minute_on ? `${stats.minute_on}'` : '—'}
                    </div>
                    <div className="text-sm text-slate-500">On</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {stats.minute_off ? `${stats.minute_off}'` : '—'}
                    </div>
                    <div className="text-sm text-slate-500">Off</div>
                  </div>
                </div>
              </div>

              {/* Attacking Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-spurs-dark">Attacking</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.goals}</div>
                    <div className="text-sm text-slate-500">Goals</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.assists}</div>
                    <div className="text-sm text-slate-500">Assists</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.shots}</div>
                    <div className="text-sm text-slate-500">Shots</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.shots_on_target}</div>
                    <div className="text-sm text-slate-500">On Target</div>
                  </div>
                </div>
              </div>

              {/* Passing & Defense */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-spurs-dark">Passing & Defense</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.passes_completed)}
                    </div>
                    <div className="text-sm text-slate-500">Passes</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.tackles)}
                    </div>
                    <div className="text-sm text-slate-500">Tackles</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.interceptions)}
                    </div>
                    <div className="text-sm text-slate-500">Interceptions</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.clearances)}
                    </div>
                    <div className="text-sm text-slate-500">Clearances</div>
                  </div>
                </div>
              </div>

              {/* Discipline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-spurs-dark">Discipline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.yellow_cards}</div>
                    <div className="text-sm text-slate-500">Yellow Cards</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">{stats.red_cards}</div>
                    <div className="text-sm text-slate-500">Red Cards</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.fouls_committed)}
                    </div>
                    <div className="text-sm text-slate-500">Fouls</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {getStatDisplay(stats.fouls_won)}
                    </div>
                    <div className="text-sm text-slate-500">Fouls Won</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-spurs-dark">Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className={`text-2xl font-bold ${getRatingColor(stats.player_rating)}`}>
                      {getStatDisplay(stats.player_rating)}
                    </div>
                    <div className="text-sm text-slate-500">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                    <div className="text-2xl font-bold text-spurs-dark">
                      {stats.player_of_the_match ? '✓' : '—'}
                    </div>
                    <div className="text-sm text-slate-500">Player of Match</div>
                  </div>
                  {stats.clean_sheet !== null && (
                    <div className="text-center p-3 bg-spurs-light rounded border border-slate-200">
                      <div className="text-2xl font-bold text-spurs-dark">
                        {stats.clean_sheet ? '✓' : '—'}
                      </div>
                      <div className="text-sm text-slate-500">Clean Sheet</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No match statistics available for this player.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
