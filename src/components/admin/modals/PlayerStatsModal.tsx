import { FormModal } from './FormModal';
import type { PlayerStats, Player, Match, Team } from '@/types/spurs-women-admin';

interface PlayerStatsModalProps {
  editingPlayerStatsId: string | null;
  form: Partial<PlayerStats>;
  onChange: (form: Partial<PlayerStats>) => void;
  error: string | null;
  players: Player[];
  matches: Match[];
  teams: Team[];
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export function PlayerStatsModal({
  editingPlayerStatsId,
  form,
  onChange,
  error,
  players,
  matches,
  teams,
  onCancel,
  onDelete,
  onSubmit,
}: PlayerStatsModalProps) {
  return (
    <FormModal
      title={editingPlayerStatsId ? 'Edit Player Stats' : 'Add Player Stats'}
      error={error}
      onCancel={onCancel}
      onDelete={editingPlayerStatsId ? onDelete : undefined}
      onSubmit={onSubmit}
      submitLabel={editingPlayerStatsId ? 'Update' : 'Create'}
    >
      <div>
        <label htmlFor="player-stats-player" className="block text-sm font-medium text-gray-300 mb-1">Player</label>
        <select
          id="player-stats-player"
          value={form.player_id}
          onChange={(e) => onChange({ ...form, player_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="">Select a player</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.first_name} {player.last_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="player-stats-match" className="block text-sm font-medium text-gray-300 mb-1">Match</label>
        <select
          id="player-stats-match"
          value={form.match_id}
          onChange={(e) => onChange({ ...form, match_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="">Select a match</option>
          {matches.map((match) => {
            const homeTeam = teams.find(t => t.id === match.home_team_id);
            const awayTeam = teams.find(t => t.id === match.away_team_id);
            return (
              <option key={match.id} value={match.id}>
                {match.date} - {homeTeam?.short_name || 'TBC'} vs {awayTeam?.short_name || 'TBC'}
              </option>
            );
          })}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="player-stats-started" className="block text-sm font-medium text-gray-300 mb-1">Started</label>
          <select
            id="player-stats-started"
            value={form.started ? 'true' : 'false'}
            onChange={(e) => onChange({ ...form, started: e.target.value === 'true' })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <div>
          <label htmlFor="player-stats-captain" className="block text-sm font-medium text-gray-300 mb-1">Captain</label>
          <select
            id="player-stats-captain"
            value={form.captain ? 'true' : 'false'}
            onChange={(e) => onChange({ ...form, captain: e.target.value === 'true' })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="player-stats-goals" className="block text-sm font-medium text-gray-300 mb-1">Goals</label>
          <input
            id="player-stats-goals"
            type="number"
            value={form.goals}
            onChange={(e) => onChange({ ...form, goals: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        <div>
          <label htmlFor="player-stats-assists" className="block text-sm font-medium text-gray-300 mb-1">Assists</label>
          <input
            id="player-stats-assists"
            type="number"
            value={form.assists}
            onChange={(e) => onChange({ ...form, assists: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="player-stats-yellow-cards" className="block text-sm font-medium text-gray-300 mb-1">Yellow Cards</label>
          <input
            id="player-stats-yellow-cards"
            type="number"
            value={form.yellow_cards}
            onChange={(e) => onChange({ ...form, yellow_cards: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        <div>
          <label htmlFor="player-stats-red-cards" className="block text-sm font-medium text-gray-300 mb-1">Red Cards</label>
          <input
            id="player-stats-red-cards"
            type="number"
            value={form.red_cards}
            onChange={(e) => onChange({ ...form, red_cards: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="player-stats-minute-on" className="block text-sm font-medium text-gray-300 mb-1">Minute On</label>
          <input
            id="player-stats-minute-on"
            type="number"
            value={form.minute_on || ''}
            onChange={(e) => onChange({ ...form, minute_on: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        <div>
          <label htmlFor="player-stats-minute-off" className="block text-sm font-medium text-gray-300 mb-1">Minute Off</label>
          <input
            id="player-stats-minute-off"
            type="number"
            value={form.minute_off || ''}
            onChange={(e) => onChange({ ...form, minute_off: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>
      <div>
        <label htmlFor="player-stats-rating" className="block text-sm font-medium text-gray-300 mb-1">Player Rating</label>
        <input
          id="player-stats-rating"
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={form.player_rating || ''}
          onChange={(e) => onChange({ ...form, player_rating: e.target.value ? parseFloat(e.target.value) : null })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
    </FormModal>
  );
}
