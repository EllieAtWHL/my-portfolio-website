'use client';

import { Card } from '@/components/Card';
import { Player } from '@/lib/data/players';

interface PlayerClientProps {
  player: Player;
}

export default function PlayerClient({ player }: PlayerClientProps) {
  return (
    <main className="p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="spurs-text text-3xl font-bold">
            {player.first_name && `${player.first_name} `}{player.last_name}
          </h1>
          {player.squad_number && (
            <p className="spurs-text text-xl opacity-75">#{player.squad_number}</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Player Details */}
          <Card variant="spursAccent" padding="md" hover={false}>
            <h2 className="spurs-text text-xl font-bold mb-4">Player Details</h2>
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
                  <span className="font-semibold">Date of Birth:</span> {new Date(player.date_of_birth).toLocaleDateString()}
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
                <span className="font-semibold">Status:</span> {player.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </Card>

          {/* Profile Image */}
          {player.profile_image_url && (
            <Card variant="spursAccent" padding="md" hover={false}>
              <h2 className="spurs-text text-xl font-bold mb-4">Profile Image</h2>
              <img 
                src={player.profile_image_url} 
                alt={`${player.first_name} ${player.last_name}`}
                className="w-full max-w-sm mx-auto rounded-lg"
              />
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
