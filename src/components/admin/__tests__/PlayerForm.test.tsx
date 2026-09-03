import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerForm } from '../PlayerForm';

const baseForm = {
  first_name: 'Alice',
  last_name: 'Smith',
  date_of_birth: null,
  nationality: null,
  position: null,
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
};

const baseProps = {
  playerForm: baseForm,
  setPlayerForm: () => {},
  isPlayerEditMode: false,
  editingPlayerId: null,
  loading: false,
  onSubmit: () => {},
  onDelete: () => {},
  onCancel: () => {},
};

describe('PlayerForm', () => {
  it('renders the Add title when creating', () => {
    render(<PlayerForm {...baseProps} />);

    expect(screen.getByText('Add New Player')).toBeInTheDocument();
  });

  it('renders the Edit title and delete/cancel actions when editing', () => {
    render(<PlayerForm {...baseProps} isPlayerEditMode editingPlayerId="player-1" />);

    expect(screen.getByText('Edit Player')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls setPlayerForm when the last name changes', () => {
    const setPlayerForm = jest.fn();
    render(<PlayerForm {...baseProps} setPlayerForm={setPlayerForm} />);

    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Jones' } });

    expect(setPlayerForm).toHaveBeenCalledWith({ ...baseForm, last_name: 'Jones' });
  });

  it('calls setPlayerForm when the position select changes', () => {
    const setPlayerForm = jest.fn();
    render(<PlayerForm {...baseProps} setPlayerForm={setPlayerForm} />);

    fireEvent.change(screen.getByLabelText(/Position/i), { target: { value: 'Midfielder' } });

    expect(setPlayerForm).toHaveBeenCalledWith({ ...baseForm, position: 'Midfielder' });
  });

  it('calls setPlayerForm when height changes', () => {
    const setPlayerForm = jest.fn();
    render(<PlayerForm {...baseProps} setPlayerForm={setPlayerForm} />);

    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '170' } });

    expect(setPlayerForm).toHaveBeenCalledWith({ ...baseForm, height_cm: 170 });
  });

  it('calls setPlayerForm when legacy number changes', () => {
    const setPlayerForm = jest.fn();
    render(<PlayerForm {...baseProps} setPlayerForm={setPlayerForm} />);

    fireEvent.change(screen.getByLabelText(/Legacy Number/i), { target: { value: '7' } });

    expect(setPlayerForm).toHaveBeenCalledWith({ ...baseForm, legacy_number: 7 });
  });

  it('submits the form', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(<PlayerForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Player/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete and onCancel', () => {
    const onDelete = jest.fn();
    const onCancel = jest.fn();
    render(<PlayerForm {...baseProps} isPlayerEditMode editingPlayerId="player-1" onDelete={onDelete} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
