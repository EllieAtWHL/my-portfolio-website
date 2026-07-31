import { Button } from '@/components/Button';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingStadiumNameId ? 'Edit Stadium Name' : 'Add Stadium Name'}
        </h3>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Valid From</label>
            <input
              type="date"
              value={form.valid_from || ''}
              onChange={(e) => onChange({ ...form, valid_from: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Valid To</label>
            <input
              type="date"
              value={form.valid_to || ''}
              onChange={(e) => onChange({ ...form, valid_to: e.target.value || null })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          {editingStadiumNameId && (
            <Button variant="spurs" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="spurs" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="spurs" onClick={onSubmit}>
            {editingStadiumNameId ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
