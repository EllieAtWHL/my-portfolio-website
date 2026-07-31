import { renderHook, act } from '@testing-library/react';
import { useTeamsAdmin } from '../useTeamsAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Team } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: '#132257', secondary_color: null };

function setup(teams: Team[] = [spurs]) {
  const setTeams = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() => useTeamsAdmin({ teams, setTeams, setLoading, showMessage }));
  return { result, setTeams, setLoading, showMessage };
}

describe('useTeamsAdmin', () => {
  beforeEach(() => {
    mockCallAdminApi.mockReset();
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
  });

  it('starts out of edit mode with the create form hidden', () => {
    const { result } = setup();

    expect(result.current.isTeamEditMode).toBe(false);
    expect(result.current.showTeamForm).toBe(false);
    expect(result.current.editingTeamId).toBeNull();
  });

  it('populates the form and enters edit mode when editing a team', () => {
    const { result } = setup();

    act(() => result.current.handleEditTeam(spurs));

    expect(result.current.isTeamEditMode).toBe(true);
    expect(result.current.showTeamForm).toBe(true);
    expect(result.current.editingTeamId).toBe(1);
    expect(result.current.teamForm).toEqual({
      name: 'Tottenham Hotspur',
      short_name: 'Spurs',
      primary_color: '#132257',
      secondary_color: null,
      is_tottenham: true,
    });
  });

  it('resets edit mode and the form on cancel', () => {
    const { result } = setup();

    act(() => result.current.handleEditTeam(spurs));
    act(() => result.current.handleCancelEditTeam());

    expect(result.current.isTeamEditMode).toBe(false);
    expect(result.current.showTeamForm).toBe(false);
    expect(result.current.editingTeamId).toBeNull();
    expect(result.current.teamForm.name).toBe('');
  });

  it('deletes a team, shows a success message, and reloads the list', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({ data: [] }); // reload GET
    const { result, setTeams, setLoading, showMessage } = setup();

    await act(async () => {
      await result.current.handleDeleteTeam(1);
    });

    expect(mockCallAdminApi).toHaveBeenCalledWith('teams', 'DELETE', { id: 1 });
    expect(showMessage).toHaveBeenCalledWith('Team deleted successfully', 'success');
    expect(setTeams).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it('shows an error message when the delete call fails', async () => {
    mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
    const { result, showMessage } = setup();

    await act(async () => {
      await result.current.handleDeleteTeam(1);
    });

    expect(showMessage).toHaveBeenCalledWith('Error deleting team', 'error');
  });

  it('submits the form as a create when not in edit mode', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 2 } }) }) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [spurs] }) }); // reload GET
    const { result, setTeams, showMessage } = setup();

    await act(async () => {
      await result.current.handleTeamSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/admin/teams', expect.objectContaining({ method: 'POST' }));
    expect(showMessage).toHaveBeenCalledWith('Team created successfully', 'success');
    expect(setTeams).toHaveBeenCalledWith([spurs]);
  });

  it('submits the form as an update when in edit mode', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 1 } }) }) // PUT
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [spurs] }) }); // reload GET
    const { result, showMessage } = setup();

    act(() => result.current.handleEditTeam(spurs));
    await act(async () => {
      await result.current.handleTeamSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/admin/teams',
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"id":1') })
    );
    expect(showMessage).toHaveBeenCalledWith('Team updated successfully', 'success');
  });

  it('filters and paginates the passed-in teams list', () => {
    const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };
    const { result } = setup([spurs, arsenal]);

    act(() => result.current.setSearch('arsenal'));

    expect(result.current.filteredCount).toBe(1);
    expect(result.current.paginatedItems).toEqual([arsenal]);
  });
});
