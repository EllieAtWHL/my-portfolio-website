import { render, screen, fireEvent } from '@testing-library/react';
import { PlayersTable } from '../PlayersTable';
import type { Player } from '@/types/spurs-women-admin';

const player: Player = {
  id: 'player-1',
  first_name: 'Alice',
  last_name: 'Smith',
  date_of_birth: null,
  nationality: 'England',
  position: 'Forward',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: null,
  created_at: '',
  updated_at: '',
};

describe('PlayersTable', () => {
  it('renders a row per player with name, position, and nationality', () => {
    render(<PlayersTable players={[player]} onSelect={() => {}} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
    expect(screen.getByText('England')).toBeInTheDocument();
  });

  it('omits the leading space when a player has no first name', () => {
    render(<PlayersTable players={[{ ...player, first_name: null }]} onSelect={() => {}} />);

    expect(screen.getByText('Smith')).toBeInTheDocument();
  });

  it('calls onSelect with the clicked player', () => {
    const onSelect = jest.fn();
    render(<PlayersTable players={[player]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Alice Smith'));

    expect(onSelect).toHaveBeenCalledWith(player);
  });

  it('shows an empty-state message when there are no players', () => {
    render(<PlayersTable players={[]} onSelect={() => {}} />);

    expect(screen.getByText('No players found')).toBeInTheDocument();
  });
});
