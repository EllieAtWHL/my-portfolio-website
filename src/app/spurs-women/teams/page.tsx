import { Card } from '@/components/Card';
import { getTeamsWithMatchCounts, TeamWithMatchCount } from '@/lib/data';
import Link from 'next/link';
import TeamPill from '@/components/spurs-women/TeamPill';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="spurs-text text-3xl font-bold mb-8 text-center">Teams</h1>
      
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
                  borderTop: team.primary_color && !isWhiteColor(team.primary_color) ? `4px solid ${team.primary_color}` : undefined,
                  borderBottom: team.secondary_color && !isWhiteColor(team.secondary_color) ? `4px solid ${team.secondary_color}` : undefined
                }}
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
    </div>
  );
}
