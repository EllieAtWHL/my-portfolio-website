'use client';

import Image from 'next/image';
import { PlayerWithStats } from '@/lib/data/players';

interface PlayerModalProps {
  player: PlayerWithStats | null;
  onClose: () => void;
  teamColor?: string;
}

export default function PlayerModal({ player, onClose, teamColor = '#081521' }: PlayerModalProps) {
  if (!player) return null;

  const fullName = `${player.first_name || ''} ${player.last_name}`.trim();
  const stats = player.player_stats;

  const getStatDisplay = (value: number | null | undefined, suffix = '') => {
    return value !== null && value !== undefined ? `${value}${suffix}` : '—';
  };

  const getRatingColor = (rating: number | null | undefined) => {
    if (!rating) return 'text-[#94a3b8]';
    if (rating >= 8.0) return 'text-[#78BEE8]';
    if (rating >= 7.0) return 'text-[#78BEE8]';
    if (rating >= 6.0) return 'text-[#78BEE8]';
    return 'text-[#94a3b8]';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f5f7fa] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e2e8f0]">
        {/* Header */}
        <div 
          className="p-6 border-b border-[#e2e8f0]"
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
                <h2 className="text-xl font-bold text-[#081521]">{fullName}</h2>
                <div className="text-[#64748b]">
                  {player.position || '—'} • {player.nationality || '—'}
                </div>
                {player.height_cm && (
                  <div className="text-sm text-[#94a3b8]">
                    {player.height_cm}cm {player.weight_kg && `• ${player.weight_kg}kg`}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-[#081521] transition-colors"
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
                <h3 className="text-lg font-semibold mb-3 text-[#081521]">Match Participation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {stats.started ? '✓' : '—'}
                    </div>
                    <div className="text-sm text-[#64748b]">Started</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.minutes_played)}
                    </div>
                    <div className="text-sm text-[#64748b]">Minutes</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {stats.minute_on ? `${stats.minute_on}'` : '—'}
                    </div>
                    <div className="text-sm text-[#64748b]">On</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {stats.minute_off ? `${stats.minute_off}'` : '—'}
                    </div>
                    <div className="text-sm text-[#64748b]">Off</div>
                  </div>
                </div>
              </div>

              {/* Attacking Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#081521]">Attacking</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.goals}</div>
                    <div className="text-sm text-[#64748b]">Goals</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.assists}</div>
                    <div className="text-sm text-[#64748b]">Assists</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.shots}</div>
                    <div className="text-sm text-[#64748b]">Shots</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.shots_on_target}</div>
                    <div className="text-sm text-[#64748b]">On Target</div>
                  </div>
                </div>
              </div>

              {/* Passing & Defense */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#081521]">Passing & Defense</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.passes_completed)}
                    </div>
                    <div className="text-sm text-[#64748b]">Passes</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.tackles)}
                    </div>
                    <div className="text-sm text-[#64748b]">Tackles</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.interceptions)}
                    </div>
                    <div className="text-sm text-[#64748b]">Interceptions</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.clearances)}
                    </div>
                    <div className="text-sm text-[#64748b]">Clearances</div>
                  </div>
                </div>
              </div>

              {/* Discipline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#081521]">Discipline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.yellow_cards}</div>
                    <div className="text-sm text-[#64748b]">Yellow Cards</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">{stats.red_cards}</div>
                    <div className="text-sm text-[#64748b]">Red Cards</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.fouls_committed)}
                    </div>
                    <div className="text-sm text-[#64748b]">Fouls</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {getStatDisplay(stats.fouls_won)}
                    </div>
                    <div className="text-sm text-[#64748b]">Fouls Won</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#081521]">Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className={`text-2xl font-bold ${getRatingColor(stats.player_rating)}`}>
                      {getStatDisplay(stats.player_rating)}
                    </div>
                    <div className="text-sm text-[#64748b]">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                    <div className="text-2xl font-bold text-[#081521]">
                      {stats.player_of_the_match ? '✓' : '—'}
                    </div>
                    <div className="text-sm text-[#64748b]">Player of Match</div>
                  </div>
                  {stats.clean_sheet !== null && (
                    <div className="text-center p-3 bg-[#f5f7fa] rounded border border-[#e2e8f0]">
                      <div className="text-2xl font-bold text-[#081521]">
                        {stats.clean_sheet ? '✓' : '—'}
                      </div>
                      <div className="text-sm text-[#64748b]">Clean Sheet</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#94a3b8]">
              No match statistics available for this player.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
