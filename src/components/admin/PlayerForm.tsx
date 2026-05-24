import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, NumberInput, SelectInput } from './FormField';

interface PlayerForm {
  first_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  is_active: boolean;
}

interface PlayerFormProps {
  playerForm: Partial<PlayerForm>;
  setPlayerForm: (form: Partial<PlayerForm>) => void;
  isPlayerEditMode: boolean;
  editingPlayerId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlayerForm({
  playerForm,
  setPlayerForm,
  isPlayerEditMode,
  editingPlayerId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: PlayerFormProps) {
  return (
    <FormWrapper
      title="Player"
      isEditMode={isPlayerEditMode}
      editingId={editingPlayerId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="First Name" htmlFor="player-first-name">
            <TextInput
              id="player-first-name"
              name="first_name"
              value={playerForm.first_name || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, first_name: value })}
            />
          </FormField>
          <FormField label="Last Name" required htmlFor="player-last-name">
            <TextInput
              id="player-last-name"
              name="last_name"
              value={playerForm.last_name || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, last_name: value })}
              required
            />
          </FormField>
          <FormField label="Date of Birth" htmlFor="player-dob">
            <TextInput
              id="player-dob"
              name="date_of_birth"
              type="date"
              value={playerForm.date_of_birth || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, date_of_birth: value })}
            />
          </FormField>
          <FormField label="Nationality" htmlFor="player-nationality">
            <TextInput
              id="player-nationality"
              name="nationality"
              value={playerForm.nationality || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, nationality: value })}
            />
          </FormField>
          <FormField label="Position" htmlFor="player-position">
            <SelectInput
              id="player-position"
              name="position"
              value={playerForm.position || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, position: value })}
              options={[
                { value: 'Goalkeeper', label: 'Goalkeeper' },
                { value: 'Defender', label: 'Defender' },
                { value: 'Midfielder', label: 'Midfielder' },
                { value: 'Forward', label: 'Forward' }
              ]}
              placeholder="Select position"
            />
          </FormField>
          <FormField label="Height (cm)" htmlFor="player-height">
            <NumberInput
              id="player-height"
              name="height_cm"
              value={playerForm.height_cm}
              onChange={(value) => setPlayerForm({ ...playerForm, height_cm: value })}
            />
          </FormField>
          <FormField label="Weight (kg)" htmlFor="player-weight">
            <NumberInput
              id="player-weight"
              name="weight_kg"
              value={playerForm.weight_kg}
              onChange={(value) => setPlayerForm({ ...playerForm, weight_kg: value })}
            />
          </FormField>
          <FormField label="Profile Image URL" htmlFor="player-image-url">
            <TextInput
              id="player-image-url"
              name="profile_image_url"
              value={playerForm.profile_image_url || ''}
              onChange={(value) => setPlayerForm({ ...playerForm, profile_image_url: value })}
            />
          </FormField>
          <FormField label="Is Active?" htmlFor="player-is-active">
            <SelectInput
              id="player-is-active"
              name="is_active"
              value={playerForm.is_active ? 'true' : 'false'}
              onChange={(value) => setPlayerForm({ ...playerForm, is_active: value === 'true' })}
              options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            />
          </FormField>
        </div>
      </FormWrapper>
  );
}
