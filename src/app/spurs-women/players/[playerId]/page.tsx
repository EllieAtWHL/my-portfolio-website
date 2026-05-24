import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPlayerById } from '@/lib/data/players';
import PlayerClient from './PlayerClient';

interface PageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);
  
  if (!player) {
    return {
      title: 'Player Not Found - Tottenham Hotspur Women',
    };
  }

  const playerName = player.first_name && player.last_name 
    ? `${player.first_name} ${player.last_name}`
    : player.last_name || 'Player';

  return {
    title: `${playerName} - Tottenham Hotspur Women`,
    description: `Player profile for ${playerName} - Tottenham Hotspur Women`,
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);

  if (!player) {
    notFound();
  }

  return <PlayerClient player={player} />;
}
