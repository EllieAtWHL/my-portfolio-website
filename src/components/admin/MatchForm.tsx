import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, NumberInput, SelectInput, CheckboxInput, RadioGroup, TextArea } from './FormField';
import { CollapsibleFormSection } from './CollapsibleFormSection';
import { MatchStatsFields } from './MatchStatsFields';
import { MatchExtraTimeFields } from './MatchExtraTimeFields';

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

export interface MatchForm {
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
  stadium_id: string;
  attended: boolean;
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
  notes: string | null;
}

interface MatchFormProps {
  matchForm: Partial<MatchForm>;
  setMatchForm: (form: Partial<MatchForm>) => void;
  seasons: Season[];
  competitions: Competition[];
  teams: Team[];
  stadiums: Stadium[];
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
    <FormWrapper
      title="Match"
      isEditMode={isEditMode}
      editingId={editingMatchId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Season" required htmlFor="season">
            <SelectInput
              id="season"
              value={matchForm.season_id || ''}
              onChange={(value) => setMatchForm({ ...matchForm, season_id: value as string })}
              options={seasons.map(season => ({ value: season.id, label: season.name }))}
              required
              placeholder="Select season"
            />
          </FormField>

          <FormField label="Competition" required htmlFor="competition">
            <SelectInput
              id="competition"
              value={matchForm.competition_id || ''}
              onChange={(value) => setMatchForm({ ...matchForm, competition_id: value as string })}
              options={competitions.map(competition => ({ value: competition.id, label: `${competition.name} (${competition.nickname})` }))}
              required
              placeholder="Select competition"
            />
          </FormField>

          <FormField label="Date" required htmlFor="date">
            <TextInput
              id="date"
              type="date"
              value={matchForm.date || ''}
              onChange={(value) => setMatchForm({ ...matchForm, date: value })}
              required
            />
          </FormField>

          <FormField label="Kickoff Time" htmlFor="kickoff-time">
            <TextInput
              id="kickoff-time"
              type="time"
              value={matchForm.kickoff_time || ''}
              onChange={(value) => setMatchForm({ ...matchForm, kickoff_time: value })}
            />
          </FormField>

          <FormField label="Match Type" required>
            <RadioGroup
              name="match-type"
              value={matchForm.is_home_match === true ? 'true' : (matchForm.is_home_match === false ? 'false' : null)}
              onChange={(value) => setMatchForm({ ...matchForm, is_home_match: value === 'true' })}
              options={[{ value: 'true', label: 'Home Match' }, { value: 'false', label: 'Away Match' }]}
            />
          </FormField>

          <FormField label={`Opponent ${matchForm.is_home_match ? 'Away' : 'Home'} Team`} required htmlFor="opponent-team">
            <SelectInput
              id="opponent-team"
              value={matchForm.is_home_match ? (matchForm.away_team_id?.toString() || '') : (matchForm.home_team_id?.toString() || '')}
              onChange={(value) => setMatchForm({ ...matchForm, [matchForm.is_home_match ? 'away_team_id' : 'home_team_id']: parseInt(value) })}
              options={teams.filter(team => !team.is_tottenham).map(team => ({ value: team.id, label: team.name }))}
              required
              placeholder="Select opponent"
            />
          </FormField>

          <FormField label="Stadium" required htmlFor="stadium">
            <SelectInput
              id="stadium"
              value={matchForm.stadium_id || ''}
              onChange={(value) => setMatchForm({ ...matchForm, stadium_id: value as string })}
              options={stadiums.map(stadium => {
                const currentName = getCurrentStadiumName(stadium.id, matchForm.date || new Date().toISOString().split('T')[0]);
                return {
                  value: stadium.id,
                  label: `${currentName} ${stadium.city && currentName !== stadium.name ? `(${stadium.city})` : ''}`
                };
              })}
              required
              placeholder="Select stadium"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Spurs Score" htmlFor="spurs-score">
              <NumberInput
                id="spurs-score"
                value={matchForm.spurs_score ?? null}
                onChange={(value) => setMatchForm({ ...matchForm, spurs_score: value })}
                min={0}
              />
            </FormField>
            <FormField label="Opponent Score" htmlFor="opponent-score">
              <NumberInput
                id="opponent-score"
                value={matchForm.opponent_score ?? null}
                onChange={(value) => setMatchForm({ ...matchForm, opponent_score: value })}
                min={0}
              />
            </FormField>
          </div>

          <CheckboxInput
            id="attended"
            checked={matchForm.attended === true}
            onChange={(checked) => setMatchForm({ ...matchForm, attended: checked })}
            label="I attended this match"
          />

          <FormField label="Attendance" htmlFor="attendance">
            <NumberInput
              id="attendance"
              value={matchForm.attendance}
              onChange={(value) => setMatchForm({ ...matchForm, attendance: value })}
              min={0}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <TextArea
            id="notes"
            value={matchForm.notes || ''}
            onChange={(value) => setMatchForm({ ...matchForm, notes: value })}
            rows={4}
          />
        </FormField>

        {/* Stats Collapsible Section */}
        <CollapsibleFormSection
          title="Match Stats"
          isOpen={showStatsSection}
          onToggle={() => setShowStatsSection(!showStatsSection)}
          controlsId="match-stats-section"
        >
          <MatchStatsFields matchForm={matchForm} setMatchForm={setMatchForm} />
        </CollapsibleFormSection>

        {/* Extra Time & Penalties Collapsible Section */}
        <CollapsibleFormSection
          title="Extra Time"
          isOpen={showExtraTimeSection}
          onToggle={() => setShowExtraTimeSection(!showExtraTimeSection)}
          controlsId="extra-time-section"
        >
          <MatchExtraTimeFields matchForm={matchForm} setMatchForm={setMatchForm} />
        </CollapsibleFormSection>

      </FormWrapper>
  );
}
