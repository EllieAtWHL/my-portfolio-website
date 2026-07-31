import { render, screen, fireEvent } from '@testing-library/react';
import { MediaModal } from '../MediaModal';
import type { Media } from '@/types/spurs-women-admin';

const baseForm: Partial<Media> = {
  match_id: 'match-1',
  type: 'social media',
  title: '',
  url: '',
  caption: '',
  sort_order: 0,
};

describe('MediaModal', () => {
  it('shows the "Add" title and hides Delete when creating', () => {
    render(
      <MediaModal
        editingMediaId={null}
        form={baseForm}
        onChange={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('Add New Media')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('shows the "Edit" title and Delete button when editing', () => {
    render(
      <MediaModal
        editingMediaId="media-1"
        form={baseForm}
        onChange={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('Edit Media')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('calls onChange with the updated title when typed', () => {
    const onChange = jest.fn();
    render(
      <MediaModal
        editingMediaId={null}
        form={baseForm}
        onChange={onChange}
        onCancel={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
      />
    );

    const titleInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(titleInput, { target: { value: 'A title' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, title: 'A title' });
  });

  it('calls onSubmit, onCancel, and onDelete when their buttons are clicked', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <MediaModal
        editingMediaId="media-1"
        form={baseForm}
        onChange={() => {}}
        onCancel={onCancel}
        onDelete={onDelete}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText('Update'));
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Delete'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
