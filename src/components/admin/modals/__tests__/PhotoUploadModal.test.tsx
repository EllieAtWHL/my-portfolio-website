import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUploadModal } from '../PhotoUploadModal';
import type { PhotoQueueItem } from '@/hooks/admin/usePhotoUploadModal';

function makeItem(overrides: Partial<PhotoQueueItem>): PhotoQueueItem {
  return {
    id: '1',
    file: new File(['bytes'], 'a.jpg', { type: 'image/jpeg' }),
    name: 'a.jpg',
    status: 'queued',
    originalSizeBytes: 1000,
    ...overrides,
  };
}

describe('PhotoUploadModal', () => {
  it('renders with an empty queue and a Choose Photos button', () => {
    render(<PhotoUploadModal photoQueue={[]} onFilesSelected={() => {}} onRetry={() => {}} onClose={() => {}} />);

    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
    expect(screen.getByText('Choose Photos')).toBeInTheDocument();
    expect(screen.queryByText(/of \d+ uploaded/)).not.toBeInTheDocument();
  });

  it('shows progress counts and per-item status', () => {
    const queue = [
      makeItem({ id: '1', name: 'a.jpg', status: 'done', optimisedSizeBytes: 2048 }),
      makeItem({ id: '2', name: 'b.jpg', status: 'error', error: 'boom' }),
      makeItem({ id: '3', name: 'c.jpg', status: 'uploading' }),
    ];

    render(<PhotoUploadModal photoQueue={queue} onFilesSelected={() => {}} onRetry={() => {}} onClose={() => {}} />);

    expect(screen.getByText('1 of 3 uploaded, 1 failed')).toBeInTheDocument();
    expect(screen.getByText('Failed: boom')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('calls onRetry only for the failed item\'s button', () => {
    const onRetry = jest.fn();
    const queue = [makeItem({ id: '1', status: 'done' }), makeItem({ id: '2', status: 'error', error: 'boom' })];

    render(<PhotoUploadModal photoQueue={queue} onFilesSelected={() => {}} onRetry={onRetry} onClose={() => {}} />);

    expect(screen.getAllByText('Retry')).toHaveLength(1);
    fireEvent.click(screen.getByText('Retry'));

    expect(onRetry).toHaveBeenCalledWith('2');
  });

  it('shows a "continues in background" close label while uploads are in progress', () => {
    const queue = [makeItem({ id: '1', status: 'uploading' })];
    render(<PhotoUploadModal photoQueue={queue} onFilesSelected={() => {}} onRetry={() => {}} onClose={() => {}} />);

    expect(screen.getByText('Close (continues in background)')).toBeInTheDocument();
  });

  it('calls onClose when closed', () => {
    const onClose = jest.fn();
    render(<PhotoUploadModal photoQueue={[]} onFilesSelected={() => {}} onRetry={() => {}} onClose={onClose} />);

    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
