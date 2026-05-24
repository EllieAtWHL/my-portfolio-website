import { FormWrapper } from './FormWrapper';
import { FormField, TextInput } from './FormField';
import { ColorPicker } from './ColorPicker';

interface TeamFormProps {
  teamForm: {
    name?: string;
    short_name?: string;
    primary_color?: string | null;
    secondary_color?: string | null;
    is_tottenham?: boolean;
  };
  setTeamForm: (form: {
    name?: string;
    short_name?: string;
    primary_color?: string | null;
    secondary_color?: string | null;
    is_tottenham?: boolean;
  }) => void;
  isTeamEditMode: boolean;
  editingTeamId: number | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function TeamForm({
  teamForm,
  setTeamForm,
  isTeamEditMode,
  editingTeamId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: TeamFormProps) {
  return (
    <FormWrapper
      title="Team"
      isEditMode={isTeamEditMode}
      editingId={editingTeamId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Team Name" required htmlFor="team-name">
            <TextInput
              id="team-name"
              name="name"
              value={teamForm.name || ''}
              onChange={(value) => setTeamForm({ ...teamForm, name: value || undefined })}
              required
            />
          </FormField>
          <FormField label="Short Name" required htmlFor="team-short-name">
            <TextInput
              id="team-short-name"
              name="short_name"
              value={teamForm.short_name || ''}
              onChange={(value) => setTeamForm({ ...teamForm, short_name: value || undefined })}
              required
            />
          </FormField>
          <div>
            <ColorPicker
              value={teamForm.primary_color || null}
              onChange={(color) => setTeamForm({ ...teamForm, primary_color: color })}
              label="Primary Color"
            />
          </div>
          <div>
            <ColorPicker
              value={teamForm.secondary_color || null}
              onChange={(color) => setTeamForm({ ...teamForm, secondary_color: color })}
              label="Secondary Color"
            />
          </div>
        </div>
      </FormWrapper>
  );
}
