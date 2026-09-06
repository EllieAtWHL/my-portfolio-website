'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/Card';
import LegacyNumberBadge from '@/components/spurs-women/LegacyNumberBadge';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { Player, PlayerMatchAppearance } from '@/lib/data/players';
import { formatDateConsistent, formatDateForCard } from '@/lib/utils/date';

interface PlayerClientProps {
  player: Player;
  matchHistory?: PlayerMatchAppearance[];
}

function getAppearanceRole(appearance: PlayerMatchAppearance): string {
  if (appearance.was_unused_substitute) return 'Unused Sub';
  if (appearance.started) return 'Started';
  return 'Sub (on)';
}

export default function PlayerClient({ player, matchHistory = [] }: PlayerClientProps) {
  const matches = useMemo(() => matchHistory.map((appearance) => appearance.match), [matchHistory]);
  const { filteredMatches, onFilteredMatchesChange } = useFilteredMatches(matches);

  const appearanceByMatchId = useMemo(
    () => new Map(matchHistory.map((appearance) => [appearance.match.id, appearance])),
    [matchHistory]
  );
  const filteredAppearances = filteredMatches
    .map((match) => appearanceByMatchId.get(match.id))
    .filter((appearance): appearance is PlayerMatchAppearance => !!appearance);

  const stats = filteredAppearances.reduce(
    (acc, appearance) => ({
      // An unused substitute never took the pitch, so it shouldn't count as an appearance.
      appearances: acc.appearances + (appearance.was_unused_substitute ? 0 : 1),
      goals: acc.goals + appearance.goals,
      assists: acc.assists + appearance.assists,
      yellow_cards: acc.yellow_cards + appearance.yellow_cards,
      red_cards: acc.red_cards + appearance.red_cards,
    }),
    { appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
  );

  return (
    <main id="main-content" className="p-4 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="spurs-text font-bold">
            {player.first_name && `${player.first_name} `}{player.last_name}
          </h1>
          {player.squad_number && (
            <p className="spurs-text text-xl opacity-75">#{player.squad_number}</p>
          )}
          {player.legacy_number != null && (
            <div className="flex justify-center mt-3">
              <LegacyNumberBadge number={player.legacy_number} size="lg" />
            </div>
          )}
        </div>

        <Card variant="spursAccent" padding="md" hover={false}>
          <h2 className="spurs-text font-bold mb-4">Player Details</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0" data-testid="player-photo">
              {player.profile_image_url ? (
                <Image
                  src={player.profile_image_url}
                  alt={`${player.first_name} ${player.last_name}`}
                  width={224}
                  height={224}
                  className="w-56 h-56 object-cover rounded-full"
                />
              ) : (
                <div
                  className="w-56 h-56 rounded-full flex flex-col items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--spurs-dark-accent)', color: 'var(--spurs-dark-bg-1)' }}
                >
                  <span className="text-5xl leading-none">
                    {player.first_name && player.first_name.charAt(0).toUpperCase()}
                    {player.last_name.charAt(0).toUpperCase()}
                  </span>
                  {player.squad_number && (
                    <span className="text-xl mt-2">#{player.squad_number}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 spurs-text">
              {player.nationality && (
                <div>
                  <span className="font-semibold">Nationality:</span> {player.nationality}
                </div>
              )}
              {player.position && (
                <div>
                  <span className="font-semibold">Position:</span> {player.position}
                </div>
              )}
              {player.date_of_birth && (
                <div>
                  <span className="font-semibold">Date of Birth:</span> {formatDateConsistent(player.date_of_birth)}
                </div>
              )}
              {player.height_cm && (
                <div>
                  <span className="font-semibold">Height:</span> {player.height_cm} cm
                </div>
              )}
              {player.weight_kg && (
                <div>
                  <span className="font-semibold">Weight:</span> {player.weight_kg} kg
                </div>
              )}
              <div>
                <span className="font-semibold">Current Club:</span>{' '}
                {player.current_club ? (
                  <Link href={`/spurs-women/teams/${player.current_club.id}`} className="spurs-text hover:underline">
                    {player.current_club.name}
                  </Link>
                ) : (
                  'No club found'
                )}
              </div>
            </div>
          </div>
        </Card>

        {player.history && player.history.length > 0 && (
          <Card variant="spursAccent" padding="md" hover={false} className="mt-6">
            <h2 className="spurs-text font-bold mb-4">Club History</h2>
            <ul className="spurs-text">
              {player.history.map((entry, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 border-b border-gray-700 last:border-b-0 last:pb-0 first:pt-0"
                >
                  <div>
                    {entry.team ? (
                      <Link href={`/spurs-women/teams/${entry.team.id}`} className="spurs-text font-semibold hover:underline">
                        {entry.team.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">Unknown club</span>
                    )}
                    {entry.squad_number && <span className="opacity-75"> · #{entry.squad_number}</span>}
                    {entry.is_loan && <span className="opacity-75"> · Loan</span>}
                  </div>
                  <div className="opacity-75 text-sm">
                    {entry.joined_on ? formatDateConsistent(entry.joined_on) : 'Unknown'} – {entry.left_on ? formatDateConsistent(entry.left_on) : 'Present'}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {matchHistory.length > 0 && (
          <div className="mt-6">
            <h2 className="spurs-text font-bold mb-4">Career Stats</h2>
            <MatchFilterControls
              matches={matches}
              onFilteredMatchesChange={onFilteredMatchesChange}
              showCompetitionFilter={true}
              showVenueFilter={false}
              showAttendedFilter={false}
              showResultFilter={false}
              showMonthFilter={false}
            />

            <Card variant="spursAccent" padding="md" hover={false} className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center spurs-text">
                <div>
                  <div className="text-2xl font-bold">{stats.appearances}</div>
                  <div className="text-sm opacity-75">Appearances</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.goals}</div>
                  <div className="text-sm opacity-75">Goals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.assists}</div>
                  <div className="text-sm opacity-75">Assists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.yellow_cards}</div>
                  <div className="text-sm opacity-75">Yellow Cards</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.red_cards}</div>
                  <div className="text-sm opacity-75">Red Cards</div>
                </div>
              </div>
            </Card>

            <Card variant="spursAccent" padding="md" hover={false}>
              <h2 className="spurs-text font-bold mb-4">Matches</h2>
              {filteredAppearances.length > 0 ? (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--spurs-dark-bg-1)' }}>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 spurs-text font-semibold">Date</th>
                        <th className="text-left py-3 px-4 spurs-text font-semibold">Opponent</th>
                        <th className="text-left py-3 px-4 spurs-text font-semibold">Competition</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">Result</th>
                        <th className="text-left py-3 px-4 spurs-text font-semibold">Role</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">Mins</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">G</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">A</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">YC</th>
                        <th className="text-center py-3 px-4 spurs-text font-semibold">RC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppearances.map((appearance) => {
                        const { match } = appearance;
                        const opponent = match.is_home_match ? match.away_team : match.home_team;
                        return (
                          <tr key={match.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-[var(--spurs-opacity-20)]">
                            <td className="py-3 px-4 spurs-text opacity-75 whitespace-nowrap">
                              {formatDateForCard(match.date)}
                            </td>
                            <td className="py-3 px-4 spurs-text">
                              <Link
                                href={`/spurs-women/matches/${match.id}`}
                                className="font-medium hover:underline"
                                style={{ color: 'var(--spurs-dark-text)' }}
                              >
                                {opponent?.name || 'Unknown'} ({match.is_home_match ? 'H' : 'A'})
                              </Link>
                            </td>
                            <td className="py-3 px-4 spurs-text opacity-75">
                              {match.competitions?.name || '-'}
                            </td>
                            <td className="py-3 px-4 text-center spurs-text">
                              {match.spurs_score ?? '-'} - {match.opponent_score ?? '-'}
                            </td>
                            <td className="py-3 px-4 spurs-text opacity-75">{getAppearanceRole(appearance)}</td>
                            <td className="py-3 px-4 text-center spurs-text">{appearance.minutes_played}</td>
                            <td className="py-3 px-4 text-center spurs-text">{appearance.goals}</td>
                            <td className="py-3 px-4 text-center spurs-text">{appearance.assists}</td>
                            <td className="py-3 px-4 text-center spurs-text">{appearance.yellow_cards}</td>
                            <td className="py-3 px-4 text-center spurs-text">{appearance.red_cards}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="spurs-text">No matches found for the selected filters.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
