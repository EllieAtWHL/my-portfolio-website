import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamById } from '@/lib/data/teams';
import TeamClient from './TeamClient';

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  const team = await getTeamById(teamId);
  
  if (!team) {
    return {
      title: 'Team Not Found - Tottenham Hotspur Women',
    };
  }

  return {
    title: `${team.name} - Tottenham Hotspur Women`,
    description: `Matches and players for ${team.name} - Tottenham Hotspur Women`,
  };
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const team = await getTeamById(teamId);

  if (!team) {
    notFound();
  }

  return <TeamClient team={team} teamId={teamId} />;
}
