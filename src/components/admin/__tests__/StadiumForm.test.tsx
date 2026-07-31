import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumForm } from '../StadiumForm';

const spurs = { id: 1, name: 'Tottenham Hotspur' };

const baseForm = {
  name: 'Tottenham Hotspur Stadium',
  slug: 'tottenham-hotspur-stadium',
  city: null,
  country: null,
  capacity: null,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: null,
};

const baseProps = {
  teams: [spurs],
  stadiumForm: baseForm,
  setStadiumForm: () => {},
  isStadiumEditMode: false,
  editingStadiumId: null,
  loading: false,
  onSubmit: () => {},
  onDelete: () => {},
  onCancel: () => {},
};

describe('StadiumForm', () => {
  it('renders the Add title when creating', () => {
    render(<StadiumForm {...baseProps} />);

    expect(screen.getByText('Add New Stadium')).toBeInTheDocument();
  });

  it('renders the Edit title and delete/cancel actions when editing', () => {
    render(<StadiumForm {...baseProps} isStadiumEditMode editingStadiumId="stadium-1" />);

    expect(screen.getByText('Edit Stadium')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls setStadiumForm when the name changes', () => {
    const setStadiumForm = jest.fn();
    render(<StadiumForm {...baseProps} setStadiumForm={setStadiumForm} />);

    fireEvent.change(screen.getByLabelText(/Stadium Name/i), { target: { value: 'New Name' } });

    expect(setStadiumForm).toHaveBeenCalledWith({ ...baseForm, name: 'New Name' });
  });

  it('calls setStadiumForm when capacity changes', () => {
    const setStadiumForm = jest.fn();
    render(<StadiumForm {...baseProps} setStadiumForm={setStadiumForm} />);

    fireEvent.change(screen.getByLabelText(/Capacity/i), { target: { value: '62850' } });

    expect(setStadiumForm).toHaveBeenCalledWith({ ...baseForm, capacity: 62850 });
  });

  it('renders team options and calls setStadiumForm when the home team changes', () => {
    const setStadiumForm = jest.fn();
    render(<StadiumForm {...baseProps} setStadiumForm={setStadiumForm} />);

    fireEvent.change(screen.getByLabelText(/Home Team/i), { target: { value: '1' } });

    expect(setStadiumForm).toHaveBeenCalledWith({ ...baseForm, home_team_id: 1 });
  });

  it('calls setStadiumForm when latitude/longitude change', () => {
    const setStadiumForm = jest.fn();
    render(<StadiumForm {...baseProps} setStadiumForm={setStadiumForm} />);

    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: '51.6' } });
    expect(setStadiumForm).toHaveBeenCalledWith({ ...baseForm, latitude: 51.6 });

    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: '-0.06' } });
    expect(setStadiumForm).toHaveBeenCalledWith({ ...baseForm, longitude: -0.06 });
  });

  it('submits the form', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(<StadiumForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Stadium/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete and onCancel', () => {
    const onDelete = jest.fn();
    const onCancel = jest.fn();
    render(<StadiumForm {...baseProps} isStadiumEditMode editingStadiumId="stadium-1" onDelete={onDelete} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
