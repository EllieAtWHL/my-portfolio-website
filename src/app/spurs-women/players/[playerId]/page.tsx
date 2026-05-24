'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { Card } from '@/components/Card';
import { getPlayerById } from '@/lib/data/players';
import { Player } from '@/lib/data/players';

interface PageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default function PlayerPage({ params }: PageProps) {
  const paramsRes = use(params);
  const { playerId } = paramsRes;
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      const data = await getPlayerById(playerId);
      
      if (!data) {
        notFound();
        return;
      }

      setPlayer(data);
      setLoading(false);
    };

    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <main className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center spurs-text">Loading...</div>
        </div>
      </main>
    );
  }

  if (!player) {
    return notFound();
  }

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
