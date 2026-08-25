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

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.queryByRole('img')).not.toBeInTheDocument();
    expect(profileCard.getByText('BE')).toBeInTheDocument();
    expect(profileCard.getByText('#9')).toBeInTheDocument();
  });

  it('falls back to a last-name-only initial when first_name is missing', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, first_name: null }} />);

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.getByText('E')).toBeInTheDocument();
  });

  it('omits the squad number line when the player has none', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, squad_number: null }} />);

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('links Current Club to the team page when the player has a current club', () => {
    render(<PlayerClient player={{ ...basePlayer, current_club: { id: 1, name: 'Tottenham Hotspur' } }} />);

    const link = screen.getByRole('link', { name: 'Tottenham Hotspur' });
    expect(link).toHaveAttribute('href', '/spurs-women/teams/1');
  });

  it('shows "No club found" instead of a link when the player has no current club', () => {
    render(<PlayerClient player={{ ...basePlayer, current_club: null }} />);

    expect(screen.getByText('No club found')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tottenham/i })).not.toBeInTheDocument();
  });

  it('formats date of birth consistently regardless of runtime locale', () => {
    render(<PlayerClient player={{ ...basePlayer, date_of_birth: '1994-06-03' }} />);

    expect(screen.getByText('03/06/1994')).toBeInTheDocument();
  });

  it('renders a Club History entry with team link, dates, squad number, and loan tag', () => {
    render(
      <PlayerClient
        player={{
          ...basePlayer,
          history: [
            {
              team: { id: 5, name: 'Chelsea' },
              joined_on: '2020-07-01',
              left_on: '2023-01-04',
              squad_number: 10,
              is_loan: true,
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Club History')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Chelsea' });
    expect(link).toHaveAttribute('href', '/spurs-women/teams/5');
    expect(screen.getByText('· #10')).toBeInTheDocument();
    expect(screen.getByText('· Loan')).toBeInTheDocument();
    expect(screen.getByText('01/07/2020 – 04/01/2023')).toBeInTheDocument();
  });

  it('shows "Present" for an ongoing history entry with no left_on', () => {
    render(
      <PlayerClient
        player={{
          ...basePlayer,
          history: [
            { team: { id: 1, name: 'Tottenham Hotspur' }, joined_on: '2023-01-05', left_on: null, squad_number: 7, is_loan: false },
          ],
        }}
      />
    );

    expect(screen.getByText('05/01/2023 – Present')).toBeInTheDocument();
  });

  it('does not render the Club History section when history is empty or absent', () => {
    render(<PlayerClient player={{ ...basePlayer, history: [] }} />);
    expect(screen.queryByText('Club History')).not.toBeInTheDocument();
  });
});
