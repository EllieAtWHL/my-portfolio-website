import { Metadata } from 'next';
import { Card } from '@/components/Card';
import { getTeamsWithMatchCounts, TeamWithMatchCount } from '@/lib/data';
import Link from 'next/link';
import TeamPill from '@/components/spurs-women/TeamPill';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Teams - Tottenham Hotspur Women',
    'Browse all teams that have played against Tottenham Hotspur Women'
  );
}

export default async function TeamsPage() {
  let teams: TeamWithMatchCount[] = [];
  
  try {
    teams = await getTeamsWithMatchCounts();
  } catch (error) {
    console.error('Error fetching teams:', error);
  }

  // Sort alphabetically by name
  teams.sort((a, b) => a.name.localeCompare(b.name));

  // Helper to check if color is white
  const isWhiteColor = (color: string | null) => {
    if (!color) return false;
    const lowerColor = color.toLowerCase();
    return lowerColor === 'white' || 
           lowerColor === '#ffffff' || 
           lowerColor === '#fff' ||
           lowerColor === 'rgb(255, 255, 255)' ||
           lowerColor === 'rgb(255,255,255)';
  };

  return (
    <main className="container mx-auto px-4 py-8 pb-footer-clearance">
      <h1 className="spurs-text font-bold mb-8 text-center">Teams</h1>
      
      {teams.length === 0 ? (
        <Card variant="spursAccent" padding="md">
          <p className="text-center spurs-text">
            No team information available at the moment.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link 
              key={team.id} 
              href={`/spurs-women/teams/${team.id}`}
              className="block spurs-text"
            >
              <div
                style={{
                  '--team-primary-color': team.primary_color && !isWhiteColor(team.primary_color) ? team.primary_color : 'transparent',
                  '--team-secondary-color': team.secondary_color && !isWhiteColor(team.secondary_color) ? team.secondary_color : 'transparent',
                  borderTop: '4px solid var(--team-primary-color)',
                  borderBottom: '4px solid var(--team-secondary-color)'
                } as React.CSSProperties}
              >
                <Card variant="spursAccent" padding="md" clickable={true}>
                  <div className="flex justify-between items-start mb-2">
                    <TeamPill 
                      teamName={team.name}
                      primaryColor={team.primary_color}
                      secondaryColor={team.secondary_color}
                      className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm font-medium transition-colors"
                    />
                    <p className="text-sm spurs-text opacity-75">
                      {team.match_count === 0 ? 'No matches' : `${team.match_count} match${team.match_count === 1 ? '' : 'es'}`}
                    </p>
                  </div>
                </Card>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
