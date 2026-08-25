import { render, screen, within } from '@testing-library/react';
import PlayerClient from '../PlayerClient';
import type { Player } from '@/lib/data/players';

const basePlayer: Player = {
  id: 'player-1',
  first_name: 'Bethany',
  last_name: 'England',
  date_of_birth: null,
  nationality: 'England',
  position: 'Forward',
  height_cm: 170,
  weight_kg: 65,
  profile_image_url: null,
  squad_number: 9,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('PlayerClient', () => {
  it('renders the profile photo when profile_image_url is set', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: 'https://cdn.example.com/photo.webp' }} />);

    const image = screen.getByRole('img', { name: 'Bethany England' });
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/photo.webp');
  });

  it('shows a two-line initials placeholder with squad number instead of hiding the card when there is no photo', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null }} />);

    const profileCard = within(screen.getByText('Profile Image').parentElement!);
    expect(profileCard.queryByRole('img')).not.toBeInTheDocument();
    expect(profileCard.getByText('BE')).toBeInTheDocument();
    expect(profileCard.getByText('#9')).toBeInTheDocument();
  });

  it('falls back to a last-name-only initial when first_name is missing', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, first_name: null }} />);

    const profileCard = within(screen.getByText('Profile Image').parentElement!);
    expect(profileCard.getByText('E')).toBeInTheDocument();
  });

  it('omits the squad number line when the player has none', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, squad_number: null }} />);

    const profileCard = within(screen.getByText('Profile Image').parentElement!);
    expect(profileCard.queryByText(/^#/)).not.toBeInTheDocument();
  });
});
