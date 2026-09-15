import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerHistoryModal } from '../PlayerHistoryModal';
import type { PlayerHistory, Team } from '@/types/spurs-women-admin';

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const reading: Team = { id: 20, name: 'Reading', short_name: 'Reading', is_tottenham: false, primary_color: null, secondary_color: null };

const baseForm: Partial<PlayerHistory> = {
  player_id: 'player-1',
  team_id: 1,
  joined_on: '',
  left_on: '',
  squad_number: null,
  on_loan_from_team_id: null,
};

const baseProps = {
  form: baseForm,
  onChange: () => {},
  error: null,
  teams: [spurs, reading],
  onCancel: () => {},
  onDelete: () => {},
  onSubmit: () => {},
};

describe('PlayerHistoryModal', () => {
  it('shows the "Add" title and hides Delete when creating', () => {
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId={null} />);

    expect(screen.getByText('Add Player History')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows the "Edit" title and Delete button when editing', () => {
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId="history-1" />);

    expect(screen.getByText('Edit Player History')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows a validation error when provided', () => {
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId={null} error="Joined On is required" />);

    expect(screen.getByText('Joined On is required')).toBeInTheDocument();
  });

  it('calls onChange when the squad number changes', () => {
    const onChange = jest.fn();
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId={null} onChange={onChange} />);

    // The label isn't associated to its input via htmlFor/id, so select by
    // DOM position: Squad Number is the only number input in this modal.
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '9' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, squad_number: 9 });
  });

  it('excludes the currently selected Team from the Loan From options, since a team cannot loan a player to itself', () => {
    render(<PlayerHistoryModal {...baseProps} form={{ ...baseForm, team_id: 1 }} editingPlayerHistoryId={null} />);

    const loanFromSelect = screen.getByLabelText('Loan From') as HTMLSelectElement;
    const optionLabels = Array.from(loanFromSelect.options).map((o) => o.textContent);
    expect(optionLabels).not.toContain('Tottenham Hotspur');
    expect(optionLabels).toContain('Reading');
  });

  it('defaults the Loan From select to "Not a loan"', () => {
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId={null} />);

    expect(screen.getByLabelText('Loan From')).toHaveValue('');
  });

  it('pre-selects the parent club when editing a loan record', () => {
    render(
      <PlayerHistoryModal
        {...baseProps}
        form={{ ...baseForm, on_loan_from_team_id: 20 }}
        editingPlayerHistoryId="history-1"
      />
    );

    expect(screen.getByLabelText('Loan From')).toHaveValue('20');
  });

  it('calls onChange with the selected team id when Loan From changes', () => {
    const onChange = jest.fn();
    render(<PlayerHistoryModal {...baseProps} editingPlayerHistoryId={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Loan From'), { target: { value: '20' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, on_loan_from_team_id: 20 });
  });

  it('calls onChange with null when Loan From is reset to "Not a loan"', () => {
    const onChange = jest.fn();
    render(
      <PlayerHistoryModal
        {...baseProps}
        form={{ ...baseForm, on_loan_from_team_id: 20 }}
        editingPlayerHistoryId="history-1"
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Loan From'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, on_loan_from_team_id: null });
  });

  it('calls onSubmit, onCancel, and onDelete', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <PlayerHistoryModal
        {...baseProps}
        editingPlayerHistoryId="history-1"
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
