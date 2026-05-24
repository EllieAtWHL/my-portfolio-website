import { Button } from '@/components/Button';
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
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isPlayerStatsEditMode && editingPlayerStatsId ? 'Edit Player Stats' : 'Add New Player Stats'}
        </h2>
        {isPlayerStatsEditMode && editingPlayerStatsId && (
          <div className="flex gap-2">
            <Button
              variant="spurs"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              variant="spurs"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      <form key={editingPlayerStatsId || 'new'} onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-season">Season <span className="text-gray-400">(optional)</span></label>
            <select
              id="player-stats-season"
              value={playerStatsSeason}
              onChange={(e) => setPlayerStatsSeason(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            >
              <option value="">All seasons</option>
              {(() => {
                const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ));
              })()}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-player">Player <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
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
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-match">Match <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
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
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-team">Team <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
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
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Match Participation <span className="text-gray-400">(optional)</span></label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="participation"
                  value="started"
                  className="mr-2"
                  style={{ accentColor: 'var(--spurs-dark-accent)' }}
                  defaultChecked={getParticipationValue() === 'started'}
                />
                Started
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="participation"
                  value="substitute"
                  className="mr-2"
                  style={{ accentColor: 'var(--spurs-dark-accent)' }}
                  defaultChecked={getParticipationValue() === 'substitute'}
                />
                Substitute
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="participation"
                  value="unused_substitute"
                  className="mr-2"
                  style={{ accentColor: 'var(--spurs-dark-accent)' }}
                  defaultChecked={getParticipationValue() === 'unused_substitute'}
                />
                Unused Substitute
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-minute-on">Minute On <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-minute-on"
              name="minute_on"
              type="number"
              min="0"
              max="120"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.minute_on || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-minute-off">Minute Off <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-minute-off"
              name="minute_off"
              type="number"
              min="0"
              max="120"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.minute_off || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-goals">Goals <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-goals"
              name="goals"
              type="number"
              min="0"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.goals || 0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-assists">Assists <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-assists"
              name="assists"
              type="number"
              min="0"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.assists || 0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-yellow-cards">Yellow Cards <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-yellow-cards"
              name="yellow_cards"
              type="number"
              min="0"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.yellow_cards || 0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-red-cards">Red Cards <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-stats-red-cards"
              name="red_cards"
              type="number"
              min="0"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.red_cards || 0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-captain">Captain? <span className="text-gray-400">(optional)</span></label>
            <select
              id="player-stats-captain"
              name="captain"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.captain?.toString() || 'false'}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-stats-pom">Player of the Match? <span className="text-gray-400">(optional)</span></label>
            <select
              id="player-stats-pom"
              name="player_of_the_match"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              defaultValue={editingPlayerStats?.player_of_the_match?.toString() || 'false'}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isPlayerStatsEditMode ? 'Updating...' : 'Creating...') : (isPlayerStatsEditMode ? 'Update Player Stats' : 'Create Player Stats')}
        </Button>
      </form>
    </div>
  );
}
