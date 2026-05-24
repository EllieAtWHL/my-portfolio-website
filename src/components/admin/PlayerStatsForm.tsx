import { FormWrapper } from './FormWrapper';
import { FormField, NumberInput, SelectInput, RadioGroup } from './FormField';
import { PlayerStats } from '@/lib/data/players';

interface Team {
  id: number;
  name: string;
  short_name: string;
  is_tottenham: boolean;
}

interface Player {
  id: string;
  first_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  squad_number: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Match {
  id: string;
  season_id: string;
  date: string;
  home_team_id: number;
  away_team_id: number;
}

interface Season {
  id: string;
  name: string;
}

interface PlayerStatsFormProps {
  playerStatsSeason: string;
  setPlayerStatsSeason: (season: string) => void;
  players: Player[];
  matches: Match[];
  teams: Team[];
  seasons: Season[];
  isPlayerStatsEditMode: boolean;
  editingPlayerStatsId: string | null;
  editingPlayerStats: PlayerStats | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlayerStatsForm({
  playerStatsSeason,
  setPlayerStatsSeason,
  players,
  matches,
  teams,
  seasons,
  isPlayerStatsEditMode,
  editingPlayerStatsId,
  editingPlayerStats,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: PlayerStatsFormProps) {
  // Determine which radio button should be checked based on editingPlayerStats
  const getParticipationValue = () => {
    if (!editingPlayerStats) return null;
    if (editingPlayerStats.started) return 'started';
    if (editingPlayerStats.was_substitute) return 'substitute';
    if (editingPlayerStats.was_unused_substitute) return 'unused_substitute';
    return null;
  };
  return (
    <FormWrapper
      title="Player Stats"
      isEditMode={isPlayerStatsEditMode}
      editingId={editingPlayerStatsId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Season" htmlFor="player-stats-season">
            <SelectInput
              id="player-stats-season"
              value={playerStatsSeason}
              onChange={(value) => setPlayerStatsSeason(value)}
              options={(() => {
                const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => ({ value: season.id, label: season.name }));
              })()}
              placeholder="All seasons"
            />
          </FormField>
          <FormField label="Player" required htmlFor="player-stats-player">
            <select
              id="player-stats-player"
              name="player_id"
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
              defaultValue={editingPlayerStats?.player_id || ''}
            >
              <option value="">Select player</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.first_name} {player.last_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Match" required htmlFor="player-stats-match">
            <select
              id="player-stats-match"
              name="match_id"
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
              defaultValue={editingPlayerStats?.match_id || ''}
            >
              <option value="">Select match</option>
              {matches.filter(match => !playerStatsSeason || match.season_id === playerStatsSeason).map(match => {
                const homeTeam = teams.find(t => t.id === match.home_team_id);
                const awayTeam = teams.find(t => t.id === match.away_team_id);
                return (
                  <option key={match.id} value={match.id}>
                    {homeTeam?.short_name} vs {awayTeam?.short_name} ({match.date})
                  </option>
                );
              })}
            </select>
          </FormField>
          <FormField label="Team" required htmlFor="player-stats-team">
            <select
              id="player-stats-team"
              name="team_id"
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
              defaultValue={editingPlayerStats?.team_id || ''}
            >
              <option value="">Select team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.is_tottenham && '(Default)'}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Match Participation">
              <RadioGroup
                name="participation"
                value={getParticipationValue()}
                onChange={() => {}}
                options={[
                  { value: 'started', label: 'Started' },
                  { value: 'substitute', label: 'Substitute' },
                  { value: 'unused_substitute', label: 'Unused Substitute' }
                ]}
              />
            </FormField>
          </div>
          <FormField label="Minute On" htmlFor="player-stats-minute-on">
            <NumberInput
              id="player-stats-minute-on"
              name="minute_on"
              min={0}
              max={120}
              value={editingPlayerStats?.minute_on || null}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Minute Off" htmlFor="player-stats-minute-off">
            <NumberInput
              id="player-stats-minute-off"
              name="minute_off"
              min={0}
              max={120}
              value={editingPlayerStats?.minute_off || null}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Goals" htmlFor="player-stats-goals">
            <NumberInput
              id="player-stats-goals"
              name="goals"
              min={0}
              value={editingPlayerStats?.goals || 0}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Assists" htmlFor="player-stats-assists">
            <NumberInput
              id="player-stats-assists"
              name="assists"
              min={0}
              value={editingPlayerStats?.assists || 0}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Yellow Cards" htmlFor="player-stats-yellow-cards">
            <NumberInput
              id="player-stats-yellow-cards"
              name="yellow_cards"
              min={0}
              value={editingPlayerStats?.yellow_cards || 0}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Red Cards" htmlFor="player-stats-red-cards">
            <NumberInput
              id="player-stats-red-cards"
              name="red_cards"
              min={0}
              value={editingPlayerStats?.red_cards || 0}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Captain?" htmlFor="player-stats-captain">
            <SelectInput
              id="player-stats-captain"
              name="captain"
              value={editingPlayerStats?.captain?.toString() || 'false'}
              options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
              onChange={() => {}}
            />
          </FormField>
          <FormField label="Player of the Match?" htmlFor="player-stats-pom">
            <SelectInput
              id="player-stats-pom"
              name="player_of_the_match"
              value={editingPlayerStats?.player_of_the_match?.toString() || 'false'}
              options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
              onChange={() => {}}
            />
          </FormField>
        </div>
      </FormWrapper>
  );
}
