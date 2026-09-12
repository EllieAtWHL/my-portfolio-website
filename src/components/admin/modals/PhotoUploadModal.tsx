import { useId, useRef } from 'react';
import { Button } from '@/components/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { PhotoQueueItem } from '@/hooks/admin/usePhotoUploadModal';

interface PhotoUploadModalProps {
  photoQueue: PhotoQueueItem[];
  onFilesSelected: (files: FileList) => void;
  onRetry: (id: string) => void;
  onClose: () => void;
}

function formatKb(bytes: number | undefined): string {
  if (bytes === undefined) return '';
  return `${Math.round(bytes / 1024)} KB`;
}

function statusLabel(item: PhotoQueueItem): string {
  switch (item.status) {
    case 'queued': return 'Queued';
    case 'compressing': return 'Compressing...';
    case 'uploading': return 'Uploading...';
    case 'done': return 'Uploaded';
    case 'error': return `Failed: ${item.error}`;
    default: return '';
  }
}

export function PhotoUploadModal({ photoQueue, onFilesSelected, onRetry, onClose }: PhotoUploadModalProps) {
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = photoQueue.filter((item) => item.status === 'done').length;
  const errorCount = photoQueue.filter((item) => item.status === 'error').length;
  const isBusy = photoQueue.some((item) => item.status === 'queued' || item.status === 'compressing' || item.status === 'uploading');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h3 id={titleId} className="text-xl font-bold text-white mb-4">Upload Photos</h3>

        <p className="text-sm text-gray-300 mb-4">
          Pick photos from this device. Each is compressed and uploaded one at a time, so a
          dropped connection only affects the photo in progress - failed photos can be retried
          individually without re-uploading the rest.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesSelected(e.target.files);
            }
            e.target.value = '';
          }}
        />
        <Button variant="spurs" onClick={() => inputRef.current?.click()} className="mb-4">
          Choose Photos
        </Button>

        {photoQueue.length > 0 && (
          <>
            <p className="text-sm text-gray-400 mb-2">
              {doneCount} of {photoQueue.length} uploaded{errorCount > 0 ? `, ${errorCount} failed` : ''}
            </p>
            <ul className="space-y-2 mb-4">
              {photoQueue.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm bg-gray-900 rounded px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-white truncate">{item.name}</div>
                    <div className={item.status === 'error' ? 'text-red-400' : 'text-gray-400'}>
                      {statusLabel(item)}
                      {item.status === 'done' && item.optimisedSizeBytes !== undefined && (
                        <> ({formatKb(item.originalSizeBytes)} → {formatKb(item.optimisedSizeBytes)})</>
                      )}
                    </div>
                  </div>
                  {item.status === 'error' && (
                    <Button variant="spurs" size="sm" onClick={() => onRetry(item.id)}>
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="spurs" onClick={onClose}>
            {isBusy ? 'Close (continues in background)' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
}
