import { Button } from '@/components/Button';

interface Team {
  id: number;
  name: string;
  short_name: string;
  is_tottenham: boolean;
}

interface Competition {
  id: string;
  name: string;
  nickname: string;
}

interface Season {
  id: string;
  name: string;
}

interface Stadium {
  id: string;
  name: string;
  city: string | null;
}

interface StadiumName {
  id: string;
  stadium_id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
}

interface MatchForm {
  season_id: string;
  competition_id: string;
  date: string;
  kickoff_time: string;
  is_home_match: boolean;
  spurs_score: number | null;
  opponent_score: number | null;
  spurs_score_aet: number | null;
  opponent_score_aet: number | null;
  spurs_score_pens: number | null;
  opponent_score_pens: number | null;
  venue: string;
  attended: boolean;
  notes: string;
  home_team_id: number;
  away_team_id: number;
  attendance: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_total_shots: number | null;
  away_total_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
}

interface MatchFormProps {
  matchForm: Partial<MatchForm>;
  setMatchForm: (form: Partial<MatchForm>) => void;
  seasons: Season[];
  competitions: Competition[];
  teams: Team[];
  stadiums: Stadium[];
  stadiumNames: StadiumName[];
  isEditMode: boolean;
  editingMatchId: string | null;
  loading: boolean;
  showStatsSection: boolean;
  showExtraTimeSection: boolean;
  setShowStatsSection: (show: boolean) => void;
  setShowExtraTimeSection: (show: boolean) => void;
  getCurrentStadiumName: (stadiumId: string, matchDate: string) => string;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function MatchForm({
  matchForm,
  setMatchForm,
  seasons,
  competitions,
  teams,
  stadiums,
  stadiumNames,
  isEditMode,
  editingMatchId,
  loading,
  showStatsSection,
  showExtraTimeSection,
  setShowStatsSection,
  setShowExtraTimeSection,
  getCurrentStadiumName,
  onSubmit,
  onDelete,
  onCancel,
}: MatchFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isEditMode ? 'Edit Match' : 'Add New Match'}
        </h2>
        {isEditMode && (
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
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Season Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="season">Season <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="season"
              value={matchForm.season_id || ''}
              onChange={(e) => setMatchForm({ ...matchForm, season_id: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="">Select season</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>

          {/* Competition Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="competition">Competition <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="competition"
              value={matchForm.competition_id || ''}
              onChange={(e) => setMatchForm({ ...matchForm, competition_id: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="">Select competition</option>
              {competitions.map(competition => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} ({competition.nickname})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="date">Date <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="date"
              type="date"
              value={matchForm.date || ''}
              onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            />
          </div>

          {/* Kickoff Time */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="kickoff-time">Kickoff Time <span className="text-gray-400">(optional)</span></label>
            <input
              id="kickoff-time"
              type="time"
              value={matchForm.kickoff_time || ''}
              onChange={(e) => setMatchForm({ ...matchForm, kickoff_time: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>

          {/* Home/Away Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Match Type <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="match-type"
                  checked={matchForm.is_home_match === true}
                  onChange={() => setMatchForm({ ...matchForm, is_home_match: true })}
                  className="mr-2"
                  required
                  style={{ accentColor: 'var(--spurs-dark-accent)' }}
                />
                Home Match
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="match-type"
                  checked={matchForm.is_home_match === false}
                  onChange={() => setMatchForm({ ...matchForm, is_home_match: false })}
                  className="mr-2"
                  required
                  style={{ accentColor: 'var(--spurs-dark-accent)' }}
                />
                Away Match
              </label>
            </div>
          </div>

          {/* Opponent Team Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="opponent-team">
              Opponent {matchForm.is_home_match ? 'Away' : 'Home'} Team <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span>
            </label>
            <select
              id="opponent-team"
              value={matchForm.is_home_match ? (matchForm.away_team_id?.toString() || '') : (matchForm.home_team_id?.toString() || '')}
              onChange={(e) => setMatchForm({ ...matchForm, [matchForm.is_home_match ? 'away_team_id' : 'home_team_id']: parseInt(e.target.value) })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="">Select opponent</option>
              {teams.filter(team => !team.is_tottenham).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="venue">Venue (Stadium) <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="venue"
              value={matchForm.venue || ''}
              onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="">Select stadium</option>
              {stadiums.map(stadium => {
                const currentName = getCurrentStadiumName(stadium.id, matchForm.date || new Date().toISOString().split('T')[0]);
                return (
                  <option key={stadium.id} value={currentName}>
                    {currentName} {stadium.city && currentName !== stadium.name ? `(${stadium.city})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="spurs-score">Spurs Score <span className="text-gray-400">(optional)</span></label>
              <input
                id="spurs-score"
                type="number"
                min="0"
                value={matchForm.spurs_score ?? ''}
                onChange={(e) => setMatchForm({ ...matchForm, spurs_score: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="opponent-score">Opponent Score <span className="text-gray-400">(optional)</span></label>
              <input
                id="opponent-score"
                type="number"
                min="0"
                value={matchForm.opponent_score ?? ''}
                onChange={(e) => setMatchForm({ ...matchForm, opponent_score: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              />
            </div>
          </div>

          {/* Attended */}
          <div>
            <label className="flex items-center">
              <input
                id="attended"
                type="checkbox"
                checked={matchForm.attended === true}
                onChange={(e) => setMatchForm({ ...matchForm, attended: e.target.checked })}
                className="mr-2"
                style={{ accentColor: 'var(--spurs-dark-accent)' }}
              />
              <span className="text-gray-400">(optional)</span> I attended this match
            </label>
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="attendance">Attendance <span className="text-gray-400">(optional)</span></label>
            <input
              id="attendance"
              type="number"
              min="0"
              value={matchForm.attendance === null || matchForm.attendance === undefined ? '' : matchForm.attendance}
              onChange={(e) => setMatchForm({ ...matchForm, attendance: e.target.value !== '' ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2 spurs-text" htmlFor="notes">Notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            id="notes"
            value={matchForm.notes || ''}
            onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            rows={4}
          />
        </div>

        {/* Stats Collapsible Section */}
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowStatsSection(!showStatsSection)}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
            style={{
              backgroundColor: showStatsSection ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderColor: showStatsSection ? 'var(--spurs-dark-accent)' : 'transparent',
              borderWidth: showStatsSection ? '2px' : '0',
            }}
          >
            <span className="font-medium text-white">Match Stats</span>
            <span className="text-gray-400 transform transition-transform">
              {showStatsSection ? '▼' : '▶'}
            </span>
          </button>
          
          {showStatsSection && (
            <div className="p-4 space-y-4 bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Possession */}
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Home Possession (%) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={matchForm.home_possession === null || matchForm.home_possession === undefined ? '' : matchForm.home_possession}
                    onChange={(e) => setMatchForm({ ...matchForm, home_possession: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Away Possession (%) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={matchForm.away_possession === null || matchForm.away_possession === undefined ? '' : matchForm.away_possession}
                    onChange={(e) => setMatchForm({ ...matchForm, away_possession: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>

                {/* Total Shots */}
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Home Total Shots <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.home_total_shots === null || matchForm.home_total_shots === undefined ? '' : matchForm.home_total_shots}
                    onChange={(e) => setMatchForm({ ...matchForm, home_total_shots: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Away Total Shots <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.away_total_shots === null || matchForm.away_total_shots === undefined ? '' : matchForm.away_total_shots}
                    onChange={(e) => setMatchForm({ ...matchForm, away_total_shots: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>

                {/* Shots On Target */}
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Home Shots On Target <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.home_shots_on_target === null || matchForm.home_shots_on_target === undefined ? '' : matchForm.home_shots_on_target}
                    onChange={(e) => setMatchForm({ ...matchForm, home_shots_on_target: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Away Shots On Target <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.away_shots_on_target === null || matchForm.away_shots_on_target === undefined ? '' : matchForm.away_shots_on_target}
                    onChange={(e) => setMatchForm({ ...matchForm, away_shots_on_target: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>

                {/* Corners */}
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Home Corners <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.home_corners === null || matchForm.home_corners === undefined ? '' : matchForm.home_corners}
                    onChange={(e) => setMatchForm({ ...matchForm, home_corners: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Away Corners <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.away_corners === null || matchForm.away_corners === undefined ? '' : matchForm.away_corners}
                    onChange={(e) => setMatchForm({ ...matchForm, away_corners: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extra Time & Penalties Collapsible Section */}
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtraTimeSection(!showExtraTimeSection)}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
            style={{
              backgroundColor: showExtraTimeSection ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderColor: showExtraTimeSection ? 'var(--spurs-dark-accent)' : 'transparent',
              borderWidth: showExtraTimeSection ? '2px' : '0',
            }}
          >
            <span className="font-medium text-white">Extra Time</span>
            <span className="text-gray-400 transform transition-transform">
              {showExtraTimeSection ? '▼' : '▶'}
            </span>
          </button>
          
          {showExtraTimeSection && (
            <div className="p-4 space-y-4 bg-gray-800/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Spurs Score (AET) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.spurs_score_aet ?? ''}
                    onChange={(e) => setMatchForm({ ...matchForm, spurs_score_aet: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Opponent Score (AET) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.opponent_score_aet ?? ''}
                    onChange={(e) => setMatchForm({ ...matchForm, opponent_score_aet: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Spurs Score (Penalties) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.spurs_score_pens ?? ''}
                    onChange={(e) => setMatchForm({ ...matchForm, spurs_score_pens: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 spurs-text">Opponent Score (Penalties) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.opponent_score_pens ?? ''}
                    onChange={(e) => setMatchForm({ ...matchForm, opponent_score_pens: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Match' : 'Create Match')}
        </Button>
      </form>
    </div>
  );
}
