import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumsTable } from '../StadiumsTable';
import type { Stadium } from '@/types/spurs-women-admin';

const stadium: Stadium = {
  id: 'stadium-1',
  name: 'Tottenham Hotspur Stadium',
  slug: 'tottenham-hotspur-stadium',
  city: 'London',
  country: 'England',
  capacity: 62850,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 1,
};

describe('StadiumsTable', () => {
  it('renders a row per stadium with name, city, and capacity', () => {
    render(<StadiumsTable stadiums={[stadium]} onSelect={() => {}} />);

    expect(screen.getByText('Tottenham Hotspur Stadium')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('62850')).toBeInTheDocument();
  });

  it('calls onSelect with the clicked stadium', () => {
    const onSelect = jest.fn();
    render(<StadiumsTable stadiums={[stadium]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Tottenham Hotspur Stadium'));

    expect(onSelect).toHaveBeenCalledWith(stadium);
  });

  it('shows an empty-state message when there are no stadiums', () => {
    render(<StadiumsTable stadiums={[]} onSelect={() => {}} />);

    expect(screen.getByText('No stadiums found')).toBeInTheDocument();
  });
});
