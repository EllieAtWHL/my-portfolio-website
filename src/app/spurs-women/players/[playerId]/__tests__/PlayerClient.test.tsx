import { render, screen } from '@testing-library/react';
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

  it('shows an initials-avatar placeholder instead of hiding the card when there is no photo', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null }} />);

    expect(screen.getByText('Profile Image')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });
});
