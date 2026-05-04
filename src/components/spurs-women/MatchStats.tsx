import { Card } from '@/components/Card';
import { getTeamColor } from '@/lib/utils/team-colors';

interface MatchStatsProps {
  possession?: {
    home: number;
    away: number;
  };
  shots?: {
    home: {
      total: number;
      onTarget: number;
    };
    away: {
      total: number;
      onTarget: number;
    };
  };
  corners?: {
    home: number;
    away: number;
  };
  homeTeam?: string;
  awayTeam?: string;
  homeTeamColor?: string;
  awayTeamColor?: string;
}

const StatCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card variant="spursAccent" padding="md" hover={false} className="h-full">
    <h3 className="font-semibold mb-3 text-center">{title}</h3>
    {children}
  </Card>
);

export default function MatchStats({ 
  possession, 
  shots, 
  corners,
  homeTeam = "Home Team",
  awayTeam = "Away Team",
  homeTeamColor = "blue",
  awayTeamColor = "gray"
}: MatchStatsProps) {
  // Debug team colors
  console.log('MatchStats Debug:', {
    homeTeam,
    awayTeam,
    homeTeamColor,
    awayTeamColor,
    homeTeamColorType: typeof homeTeamColor,
    awayTeamColorType: typeof awayTeamColor
  });

  // If no stats data, don't render
  if (!possession && !shots && !corners) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold media-title mb-4">Match Statistics</h2>
      
      {/* Mobile: Single column, Tablet+: Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Possession */}
        {possession && (
          <StatCard title="Possession">
            <div className="text-center">
              <div className="flex justify-around items-center mb-2">
                <span className="text-2xl font-bold">{possession.home}%</span>
                <span className="text-gray-500">vs</span>
                <span className="text-2xl font-bold">{possession.away}%</span>
              </div>
              <div className="flex gap-1">
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${possession.home}%`,
                    backgroundColor: getTeamColor(homeTeamColor)
                  }} 
                />
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${possession.away}%`,
                    backgroundColor: getTeamColor(awayTeamColor)
                  }} 
                />
              </div>
                          </div>
          </StatCard>
        )}

        {/* Shots */}
        {shots && (
          <StatCard title="Shots">
            <div className="text-center">
              <div className="flex justify-around items-center mb-2">
                <span className="text-2xl font-bold">{shots.home.total}</span>
                <span className="text-gray-500">vs</span>
                <span className="text-2xl font-bold">{shots.away.total}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">{shots.home.onTarget}</span>
                <span className="text-xs text-gray-600">On Target</span>
                <span className="text-sm">{shots.away.onTarget}</span>
              </div>
              <div className="flex gap-1">
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${(shots.home.onTarget / Math.max(shots.home.onTarget, shots.away.onTarget)) * 100}%`,
                    backgroundColor: getTeamColor(homeTeamColor)
                  }} 
                />
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${(shots.away.onTarget / Math.max(shots.home.onTarget, shots.away.onTarget)) * 100}%`,
                    backgroundColor: getTeamColor(awayTeamColor)
                  }} 
                />
              </div>
                          </div>
          </StatCard>
        )}

        {/* Corners */}
        {corners && (
          <StatCard title="Corners">
            <div className="text-center">
              <div className="flex justify-around items-center mb-2">
                <span className="text-2xl font-bold">{corners.home}</span>
                <span className="text-gray-500">vs</span>
                <span className="text-2xl font-bold">{corners.away}</span>
              </div>
              <div className="flex gap-1">
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${(corners.home / Math.max(corners.home, corners.away)) * 100}%`,
                    backgroundColor: getTeamColor(homeTeamColor)
                  }} 
                />
                <div 
                  className="rounded-full h-3 transition-colors" 
                  style={{ 
                    width: `${(corners.away / Math.max(corners.home, corners.away)) * 100}%`,
                    backgroundColor: getTeamColor(awayTeamColor)
                  }} 
                />
              </div>
                          </div>
          </StatCard>
        )}

      </div>
    </div>
  );
}
