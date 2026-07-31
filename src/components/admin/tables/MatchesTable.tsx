import type { Match, Team, Competition } from '@/types/spurs-women-admin';

interface MatchesTableProps {
  matches: Match[];
  teams: Team[];
  competitions: Competition[];
  onSelect: (match: Match) => void;
}

export function MatchesTable({ matches, teams, competitions, onSelect }: MatchesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left p-2 spurs-text">Date</th>
            <th className="text-left p-2 spurs-text">Teams</th>
            <th className="text-left p-2 spurs-text">Competition</th>
            <th className="text-left p-2 spurs-text">Score</th>
            <th className="text-left p-2 spurs-text">Venue</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(match => {
            const homeTeam = teams.find(t => t.id === match.home_team_id);
            const awayTeam = teams.find(t => t.id === match.away_team_id);
            const competition = competitions.find(c => c.id === match.competition_id);
            const displayVenue = match.stadium_display_name;

            return (
              <tr
                key={match.id}
                className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => onSelect(match)}
              >
                <td className="p-2 spurs-text">{match.date}</td>
                <td className="p-2 spurs-text">{homeTeam?.short_name} vs {awayTeam?.short_name}</td>
                <td className="p-2 spurs-text">{competition?.nickname}</td>
                <td className="p-2 spurs-text">{match.spurs_score ?? '-'} - {match.opponent_score ?? '-'}</td>
                <td className="p-2 spurs-text">{displayVenue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
