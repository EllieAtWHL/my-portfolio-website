import { FormModal } from './FormModal';
import type { StadiumName } from '@/types/spurs-women-admin';

interface StadiumNameModalProps {
  editingStadiumNameId: string | null;
  form: Partial<StadiumName>;
  onChange: (form: Partial<StadiumName>) => void;
  error: string | null;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export function StadiumNameModal({
  editingStadiumNameId,
  form,
  onChange,
  error,
  onCancel,
  onDelete,
  onSubmit,
}: StadiumNameModalProps) {
  return (
    <FormModal
      title={editingStadiumNameId ? 'Edit Stadium Name' : 'Add Stadium Name'}
      error={error}
      onCancel={onCancel}
      onDelete={editingStadiumNameId ? onDelete : undefined}
      onSubmit={onSubmit}
      submitLabel={editingStadiumNameId ? 'Update' : 'Create'}
    >
      <div>
        <label htmlFor="stadium-name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input
          id="stadium-name"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      <div>
        <label htmlFor="stadium-valid-from" className="block text-sm font-medium text-gray-300 mb-1">Valid From</label>
        <input
          id="stadium-valid-from"
          type="date"
          value={form.valid_from || ''}
          onChange={(e) => onChange({ ...form, valid_from: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          required
        />
      </div>
      <div>
        <label htmlFor="stadium-valid-to" className="block text-sm font-medium text-gray-300 mb-1">Valid To</label>
        <input
          id="stadium-valid-to"
          type="date"
          value={form.valid_to || ''}
          onChange={(e) => onChange({ ...form, valid_to: e.target.value || null })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
    </FormModal>
  );
}
