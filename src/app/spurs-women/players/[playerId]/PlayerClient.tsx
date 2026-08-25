'use client';

import Link from 'next/link';
import { Card } from '@/components/Card';
import { Player } from '@/lib/data/players';
import { formatDateConsistent } from '@/lib/utils/date';

interface PlayerClientProps {
  player: Player;
}

export default function PlayerClient({ player }: PlayerClientProps) {
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
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Player Details */}
          <Card variant="spursAccent" padding="md" hover={false}>
            <h2 className="spurs-text font-bold mb-4">Player Details</h2>
            <div className="space-y-3 spurs-text">
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
          </Card>

          {/* Profile Image */}
          <Card variant="spursAccent" padding="md" hover={false}>
            <h2 className="spurs-text font-bold mb-4">Profile Image</h2>
            {player.profile_image_url ? (
              <img
                src={player.profile_image_url}
                alt={`${player.first_name} ${player.last_name}`}
                className="w-56 h-56 object-cover mx-auto rounded-full"
              />
            ) : (
              <div
                className="w-56 h-56 mx-auto rounded-full flex flex-col items-center justify-center font-bold"
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
          </Card>
        </div>

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
      </div>
    </main>
  );
}
