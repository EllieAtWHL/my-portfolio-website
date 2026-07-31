import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumNameModal } from '../StadiumNameModal';
import type { StadiumName } from '@/types/spurs-women-admin';

const baseForm: Partial<StadiumName> = {
  stadium_id: 'stadium-1',
  name: '',
  valid_from: '',
  valid_to: null,
};

const baseProps = {
  form: baseForm,
  onChange: () => {},
  error: null,
  onCancel: () => {},
  onDelete: () => {},
  onSubmit: () => {},
};

describe('StadiumNameModal', () => {
  it('shows the "Add" title and hides Delete when creating', () => {
    render(<StadiumNameModal {...baseProps} editingStadiumNameId={null} />);

    expect(screen.getByText('Add Stadium Name')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows the "Edit" title and Delete button when editing', () => {
    render(<StadiumNameModal {...baseProps} editingStadiumNameId="name-1" />);

    expect(screen.getByText('Edit Stadium Name')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows a validation error when provided', () => {
    render(<StadiumNameModal {...baseProps} editingStadiumNameId={null} error="Valid From is required" />);

    expect(screen.getByText('Valid From is required')).toBeInTheDocument();
  });

  it('calls onChange when the name field changes', () => {
    const onChange = jest.fn();
    render(<StadiumNameModal {...baseProps} editingStadiumNameId={null} onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New Stadium Name' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, name: 'New Stadium Name' });
  });

  it('calls onSubmit, onCancel, and onDelete', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <StadiumNameModal
        {...baseProps}
        editingStadiumNameId="name-1"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
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
