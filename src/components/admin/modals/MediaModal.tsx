import { Button } from '@/components/Button';
import type { Media } from '@/types/spurs-women-admin';

interface MediaModalProps {
  editingMediaId: string | null;
  form: Partial<Media>;
  onChange: (form: Partial<Media>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export function MediaModal({ editingMediaId, form, onChange, onCancel, onDelete, onSubmit }: MediaModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingMediaId ? 'Edit Media' : 'Add New Media'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => onChange({ ...form, type: e.target.value as Media['type'] })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="photo">Photo</option>
              <option value="photo album">Photo Album</option>
              <option value="article">Article</option>
              <option value="social media">Social Media</option>
              <option value="video-external">Video (External)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
            <input
              type="text"
              value={form.url || ''}
              onChange={(e) => onChange({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Caption</label>
            <textarea
              value={form.caption || ''}
              onChange={(e) => onChange({ ...form, caption: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => onChange({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          {editingMediaId && (
            <Button variant="spurs" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="spurs" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="spurs" onClick={onSubmit}>
            {editingMediaId ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
