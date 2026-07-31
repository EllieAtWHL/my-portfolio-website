import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '../page';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: 'admin@example.com' } } }),
      signOut: async () => ({}),
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockTeam = {
  id: 1,
  name: 'Tottenham Hotspur',
  short_name: 'Spurs',
  is_tottenham: true,
  primary_color: null,
  secondary_color: null,
};

jest.mock('@/lib/api-client', () => ({
  callAdminApi: async (endpoint: string) => {
    if (endpoint === 'teams') return { data: [mockTeam] };
    return { data: [] };
  },
  createEntityAndReload: async () => ({}),
}));

beforeAll(() => {
  window.scrollTo = jest.fn();
});

describe('AdminPage tabs', () => {
  it('renames tabs from "Add X" to the plural entity name', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Matches')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Players' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stadiums' })).toBeInTheDocument();

    expect(screen.queryByText('Add Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Team')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Stadium')).not.toBeInTheDocument();
  });

  it('hides the create form by default and reveals it via the New button, per tab', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    // Matches tab is active by default
    expect(screen.queryByText('Add New Match')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Match'));
    expect(await screen.findByText('Add New Match')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Match')).not.toBeInTheDocument());

    // Teams tab
    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    await waitFor(() => expect(screen.getByText('+ New Team')).toBeInTheDocument());
    expect(screen.queryByText('Add New Team')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Team'));
    expect(await screen.findByText('Add New Team')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Team')).not.toBeInTheDocument());

    // Players tab
    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    await waitFor(() => expect(screen.getByText('+ New Player')).toBeInTheDocument());
    expect(screen.queryByText('Add New Player')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Player'));
    expect(await screen.findByText('Add New Player')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Player')).not.toBeInTheDocument());

    // Stadiums tab
    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    await waitFor(() => expect(screen.getByText('+ New Stadium')).toBeInTheDocument());
    expect(screen.queryByText('Add New Stadium')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Stadium'));
    expect(await screen.findByText('Add New Stadium')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Stadium')).not.toBeInTheDocument());
  });

  it('hides the create form again after switching tabs and back', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByText('+ New Match'));
    expect(await screen.findByText('Add New Match')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    await waitFor(() => expect(screen.getByText('+ New Team')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Matches' }));
    await waitFor(() => expect(screen.getByText('+ New Match')).toBeInTheDocument());
    expect(screen.queryByText('Add New Match')).not.toBeInTheDocument();
  });

  it('opens the form in edit mode (without a New click) when an existing record is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    const teamRow = await screen.findByText('Tottenham Hotspur');
    fireEvent.click(teamRow);

    expect(await screen.findByText('Edit Team')).toBeInTheDocument();
    // The New/Cancel toggle button is hidden while an edit is in progress
    expect(screen.queryByText('+ New Team')).not.toBeInTheDocument();
  });
});
