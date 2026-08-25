import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPlayerById, getPlayerMatchHistory } from '@/lib/data/players';
import PlayerClient from './PlayerClient';
import { generatePageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);
  
  if (!player) {
    return generatePageMetadata(
      'Player Not Found - Tottenham Hotspur Women',
      'The requested player could not be found'
    );
  }

  const playerName = player.first_name && player.last_name 
    ? `${player.first_name} ${player.last_name}`
    : player.last_name || 'Player';

  return generatePageMetadata(
    `${playerName} - Tottenham Hotspur Women`,
    `Player profile for ${playerName} - Tottenham Hotspur Women`
  );
}

export default async function PlayerPage({ params }: PageProps) {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);

  if (!player) {
    notFound();
  }

  const matchHistory = await getPlayerMatchHistory(playerId);

  return <PlayerClient player={player} matchHistory={matchHistory} />;
}
