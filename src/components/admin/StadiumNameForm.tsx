import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, SelectInput } from './FormField';

interface Stadium {
  id: string;
  name: string;
  city: string | null;
}

interface StadiumNameFormProps {
  stadiums: Stadium[];
  stadiumNameForm: {
    stadium_id?: string;
    name?: string;
    valid_from?: string | null;
    valid_to?: string | null;
  };
  setStadiumNameForm: (form: {
    stadium_id?: string;
    name?: string;
    valid_from?: string | null;
    valid_to?: string | null;
  }) => void;
  isStadiumNameEditMode: boolean;
  editingStadiumNameId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function StadiumNameForm({
  stadiums,
  stadiumNameForm,
  setStadiumNameForm,
  isStadiumNameEditMode,
  editingStadiumNameId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: StadiumNameFormProps) {
  return (
    <FormWrapper
      title="Stadium Name"
      isEditMode={isStadiumNameEditMode}
      editingId={editingStadiumNameId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Stadium" required htmlFor="stadium-name-stadium">
            <SelectInput
              id="stadium-name-stadium"
              name="stadium_id"
              value={stadiumNameForm.stadium_id || ''}
              onChange={(value) => setStadiumNameForm({ ...stadiumNameForm, stadium_id: value as string })}
              options={stadiums.map(stadium => ({ value: stadium.id, label: `${stadium.name} ${stadium.city ? `(${stadium.city})` : ''}` }))}
              required
              placeholder="Select stadium"
            />
          </FormField>
          <FormField label="Stadium Name" required htmlFor="stadium-name-name">
            <TextInput
              id="stadium-name-name"
              name="name"
              value={stadiumNameForm.name || ''}
              onChange={(value) => setStadiumNameForm({ ...stadiumNameForm, name: value })}
              required
            />
          </FormField>
          <FormField label="Valid From" htmlFor="stadium-name-valid-from">
            <TextInput
              id="stadium-name-valid-from"
              name="valid_from"
              type="date"
              value={stadiumNameForm.valid_from || ''}
              onChange={(value) => setStadiumNameForm({ ...stadiumNameForm, valid_from: value })}
            />
          </FormField>
          <FormField label="Valid To" htmlFor="stadium-name-valid-to">
            <TextInput
              id="stadium-name-valid-to"
              name="valid_to"
              type="date"
              value={stadiumNameForm.valid_to || ''}
              onChange={(value) => setStadiumNameForm({ ...stadiumNameForm, valid_to: value })}
            />
          </FormField>
        </div>
        <div className="text-sm text-gray-400 mb-4">
          <p>Use this form to add historical stadium names or naming variations. For example:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Previous names (e.g., &ldquo;White Hart Lane&rdquo;)</li>
            <li>Sponsored names (e.g., &ldquo;Tottenham Hotspur Stadium&rdquo;)</li>
            <li>Historical variations</li>
          </ul>
        </div>
      </FormWrapper>
  );
}
