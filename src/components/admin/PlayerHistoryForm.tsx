import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, NumberInput, SelectInput } from './FormField';

interface Team {
  id: number;
  name: string;
  is_tottenham: boolean;
}

interface Player {
  id: string;
  first_name: string | null;
  last_name: string;
}

interface PlayerHistory {
  id: string;
  player_id: string;
  team_id: number;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
}

interface PlayerHistoryFormProps {
  players: Player[];
  teams: Team[];
  loading: boolean;
  playerHistoryForm: Partial<PlayerHistory>;
  setPlayerHistoryForm: (form: Partial<PlayerHistory>) => void;
  isEditMode: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlayerHistoryForm({
  players,
  teams,
  loading,
  playerHistoryForm,
  setPlayerHistoryForm,
  isEditMode,
  onSubmit,
  onDelete,
  onCancel,
}: PlayerHistoryFormProps) {
  return (
    <FormWrapper
      title="Player History"
      isEditMode={isEditMode}
      editingId={playerHistoryForm.id}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Player" required htmlFor="player-history-player">
            <SelectInput
              id="player-history-player"
              name="player_id"
              value={playerHistoryForm.player_id || ''}
              onChange={(value) => setPlayerHistoryForm({ ...playerHistoryForm, player_id: value as string })}
              options={players.map(player => ({ value: player.id, label: `${player.first_name} ${player.last_name}` }))}
              required
              placeholder="Select player"
            />
          </FormField>
          <FormField label="Team" required htmlFor="player-history-team">
            <SelectInput
              id="player-history-team"
              name="team_id"
              value={playerHistoryForm.team_id?.toString() || ''}
              onChange={(value) => setPlayerHistoryForm({ ...playerHistoryForm, team_id: parseInt(value) })}
              options={teams.map(team => ({ value: team.id, label: `${team.name} ${team.is_tottenham ? '(Default)' : ''}` }))}
              required
              placeholder="Select team"
            />
          </FormField>
          <FormField label="Joined On" htmlFor="player-history-joined">
            <TextInput
              id="player-history-joined"
              name="joined_on"
              type="date"
              value={playerHistoryForm.joined_on || ''}
              onChange={(value) => setPlayerHistoryForm({ ...playerHistoryForm, joined_on: value })}
            />
          </FormField>
          <FormField label="Left On" htmlFor="player-history-left">
            <TextInput
              id="player-history-left"
              name="left_on"
              type="date"
              value={playerHistoryForm.left_on || ''}
              onChange={(value) => setPlayerHistoryForm({ ...playerHistoryForm, left_on: value })}
            />
          </FormField>
          <FormField label="Squad Number" htmlFor="player-history-squad">
            <NumberInput
              id="player-history-squad"
              name="squad_number"
              min={1}
              max={99}
              value={playerHistoryForm.squad_number ?? null}
              onChange={(value) => setPlayerHistoryForm({ ...playerHistoryForm, squad_number: value })}
            />
          </FormField>
        </div>
      </FormWrapper>
  );
}
