import { FormModal } from './FormModal';
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
    <FormModal
      title={editingMediaId ? 'Edit Media' : 'Add New Media'}
      onCancel={onCancel}
      onDelete={editingMediaId ? onDelete : undefined}
      onSubmit={onSubmit}
      submitLabel={editingMediaId ? 'Update' : 'Create'}
    >
      <div>
        <label htmlFor="media-type" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
        <select
          id="media-type"
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
        <label htmlFor="media-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input
          id="media-title"
          type="text"
          value={form.title || ''}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      <div>
        <label htmlFor="media-url" className="block text-sm font-medium text-gray-300 mb-1">URL</label>
        <input
          id="media-url"
          type="text"
          value={form.url || ''}
          onChange={(e) => onChange({ ...form, url: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      <div>
        <label htmlFor="media-caption" className="block text-sm font-medium text-gray-300 mb-1">Caption</label>
        <textarea
          id="media-caption"
          value={form.caption || ''}
          onChange={(e) => onChange({ ...form, caption: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          rows={3}
        />
      </div>
      <div>
        <label htmlFor="media-sort-order" className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
        <input
          id="media-sort-order"
          type="number"
          value={form.sort_order}
          onChange={(e) => onChange({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
    </FormModal>
  );
}
