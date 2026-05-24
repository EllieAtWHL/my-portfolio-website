import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamById } from '@/lib/data/teams';
import TeamClient from './TeamClient';
import { generatePageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  const team = await getTeamById(teamId);
  
  if (!team) {
    return generatePageMetadata(
      'Team Not Found - Tottenham Hotspur Women',
      'The requested team could not be found'
    );
  }

  return generatePageMetadata(
    `${team.name} - Tottenham Hotspur Women`,
    `Matches and players for ${team.name} - Tottenham Hotspur Women`
  );
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const team = await getTeamById(teamId);

  if (!team) {
    notFound();
  }

  return <TeamClient team={team} teamId={teamId} />;
}
