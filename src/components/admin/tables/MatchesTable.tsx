import { DataTable } from './DataTable';
import type { Match, Team, Competition } from '@/types/spurs-women-admin';

interface MatchesTableProps {
  matches: Match[];
  teams: Team[];
  competitions: Competition[];
  onSelect: (match: Match) => void;
}

export function MatchesTable({ matches, teams, competitions, onSelect }: MatchesTableProps) {
  return (
    <DataTable
      records={matches}
      getRowKey={(match) => match.id}
      onRowClick={onSelect}
      emptyMessage="No matches found"
      columns={[
        { key: 'date', label: 'Date', render: (match) => match.date },
        {
          key: 'teams',
          label: 'Teams',
          render: (match) => {
            const homeTeam = teams.find(t => t.id === match.home_team_id);
            const awayTeam = teams.find(t => t.id === match.away_team_id);
            return <>{homeTeam?.short_name} vs {awayTeam?.short_name}</>;
          },
        },
        {
          key: 'competition',
          label: 'Competition',
          render: (match) => competitions.find(c => c.id === match.competition_id)?.nickname,
        },
        {
          key: 'score',
          label: 'Score',
          render: (match) => <>{match.spurs_score ?? '-'} - {match.opponent_score ?? '-'}</>,
        },
        { key: 'venue', label: 'Venue', render: (match) => match.stadium_display_name },
      ]}
    />
  );
}
