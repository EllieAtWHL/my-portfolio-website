import { renderHook, act } from '@testing-library/react';
import { useTeamsAdmin } from '../useTeamsAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Team } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: '#132257', secondary_color: null };

const EMPTY_TEAM_FORM = {
  name: '',
  short_name: '',
  primary_color: null,
  secondary_color: null,
  is_tottenham: false,
};

function setup(teams: Team[] = [spurs]) {
  const setTeams = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() => useTeamsAdmin({ teams, setTeams, setLoading, showMessage }));
  return { result, setTeams, setLoading, showMessage };
}

const preventDefault = { preventDefault: () => {} } as React.FormEvent;

/** Rejects the create/update fetch call with `rejection` and returns the mocks. */
async function submitWithFetchFailure(rejection: unknown, editMode: boolean) {
  (global.fetch as jest.Mock).mockRejectedValueOnce(rejection);
  const { result, showMessage, setLoading } = setup();
  if (editMode) {
    act(() => result.current.handleEditTeam(spurs));
  }
  await act(async () => {
    await result.current.handleTeamSubmit(preventDefault);
  });
  return { result, showMessage, setLoading };
}

/** Resolves the create fetch call as ok:false with the given JSON body. */
async function submitWithNotOkResponse(jsonBody: Record<string, unknown>, editMode: boolean) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => jsonBody });
  const { result, showMessage } = setup();
  if (editMode) {
    act(() => result.current.handleEditTeam(spurs));
  }
  await act(async () => {
    await result.current.handleTeamSubmit(preventDefault);
  });
  return { showMessage };
}

/** Submits a create with the given form overrides applied, returns the parsed request body. */
async function submitAndGetBody(formOverrides: Partial<Team>) {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 5 } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
  const { result } = setup();
  act(() => result.current.setTeamForm((prev) => ({ ...prev, ...formOverrides })));
  await act(async () => {
    await result.current.handleTeamSubmit(preventDefault);
  });
  const call = (global.fetch as jest.Mock).mock.calls[0];
  return JSON.parse(call[1].body);
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

  it('initializes the team form with the exact empty shape', () => {
    const { result } = setup();

    expect(result.current.teamForm).toEqual(EMPTY_TEAM_FORM);
  });

  it('populates the form, enters edit mode, and scrolls to the form when editing a team', () => {
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
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 250, left: 0, behavior: 'smooth' });
  });

  it('resets edit mode and the form to the exact empty shape on cancel', () => {
    const { result } = setup();

    act(() => result.current.handleEditTeam(spurs));
    act(() => result.current.handleCancelEditTeam());

    expect(result.current.isTeamEditMode).toBe(false);
    expect(result.current.showTeamForm).toBe(false);
    expect(result.current.editingTeamId).toBeNull();
    expect(result.current.teamForm).toEqual(EMPTY_TEAM_FORM);
  });

  it('resets edit mode, form visibility, editing id, and the current page', () => {
    const manyTeams: Team[] = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Team ${i + 1}`,
      short_name: `T${i + 1}`,
      is_tottenham: false,
      primary_color: null,
      secondary_color: null,
    }));
    const { result } = setup(manyTeams);

    act(() => result.current.handleEditTeam(manyTeams[0]));
    act(() => result.current.setCurrentPage(2));

    expect(result.current.isTeamEditMode).toBe(true);
    expect(result.current.currentPage).toBe(2);

    act(() => result.current.resetTabState());

    expect(result.current.isTeamEditMode).toBe(false);
    expect(result.current.editingTeamId).toBeNull();
    expect(result.current.showTeamForm).toBe(false);
    expect(result.current.currentPage).toBe(1);
  });

  describe('search filtering', () => {
    it('matches on short_name even when name is missing, case-insensitively', () => {
      const noName = { id: 3, name: undefined, short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null } as unknown as Team;
      const { result } = setup([spurs, noName]);

      act(() => result.current.setSearch('ars'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([noName]);
    });

    it('matches on name even when short_name is missing', () => {
      const noShortName = { id: 4, name: 'Chelsea', short_name: undefined, is_tottenham: false, primary_color: null, secondary_color: null } as unknown as Team;
      const { result } = setup([spurs, noShortName]);

      act(() => result.current.setSearch('chelsea'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([noShortName]);
    });

    it('filters and paginates the passed-in teams list', () => {
      const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };
      const { result } = setup([spurs, arsenal]);

      act(() => result.current.setSearch('arsenal'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([arsenal]);
    });
  });

  describe('handleDeleteTeam', () => {
    it('deletes a team, shows a success message, and reloads the list', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result, setTeams, setLoading, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteTeam(1);
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'teams', 'DELETE', { id: 1 });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'teams', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Team deleted successfully', 'success');
      expect(setTeams).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('does not update teams and still reports success when the post-delete reload fails', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockRejectedValueOnce(new Error('reload boom')); // reload GET fails
      const { result, setTeams, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteTeam(1);
      });

      expect(showMessage).toHaveBeenCalledWith('Team deleted successfully', 'success');
      expect(setTeams).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('does not update teams when the post-delete reload response has no data', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({}); // reload GET, no data field
      const { result, setTeams } = setup();

      await act(async () => {
        await result.current.handleDeleteTeam(1);
      });

      expect(setTeams).not.toHaveBeenCalled();
    });

    it('shows an error message, does not touch teams, and clears loading when the delete call fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result, showMessage, setTeams, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteTeam(1);
      });

      expect(showMessage).toHaveBeenCalledWith('Error deleting team', 'error');
      expect(setTeams).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });
  });

  describe('handleTeamSubmit - request shape', () => {
    it('submits the form as a create when not in edit mode, with JSON headers', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 2 } }) }) // POST
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [spurs] }) }); // reload GET
      const { result, setTeams, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleTeamSubmit(preventDefault);
      });

      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/admin/teams', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(showMessage).toHaveBeenCalledWith('Team created successfully', 'success');
      expect(setTeams).toHaveBeenCalledWith([spurs]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('submits the form as an update when in edit mode, with JSON headers', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 1 } }) }) // PUT
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [spurs] }) }); // reload GET
      const { result, showMessage } = setup();

      act(() => result.current.handleEditTeam(spurs));
      await act(async () => {
        await result.current.handleTeamSubmit(preventDefault);
      });

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/admin/teams',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"id":1'),
        })
      );
      expect(showMessage).toHaveBeenCalledWith('Team updated successfully', 'success');
    });

    it('does not update teams and still reports success when the post-submit reload fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 2 } }) }) // POST
        .mockRejectedValueOnce(new Error('reload boom')); // reload GET fails
      const { result, setTeams, showMessage } = setup();

      await act(async () => {
        await result.current.handleTeamSubmit(preventDefault);
      });

      expect(showMessage).toHaveBeenCalledWith('Team created successfully', 'success');
      expect(setTeams).not.toHaveBeenCalled();
    });

    it('does not update teams when the post-submit reload response has no data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 2 } }) }) // POST
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // reload GET, no data
      const { result, setTeams } = setup();

      await act(async () => {
        await result.current.handleTeamSubmit(preventDefault);
      });

      expect(setTeams).not.toHaveBeenCalled();
    });
  });

  describe('handleTeamSubmit - payload fallbacks', () => {
    it('sends primary_color, secondary_color, and is_tottenham as-is when truthy', async () => {
      const body = await submitAndGetBody({ primary_color: '#fff', secondary_color: '#000', is_tottenham: true });

      expect(body.primary_color).toBe('#fff');
      expect(body.secondary_color).toBe('#000');
      expect(body.is_tottenham).toBe(true);
    });

    it('falls back to null/false when the form fields are falsy-but-defined', async () => {
      const body = await submitAndGetBody({ primary_color: '', secondary_color: '', is_tottenham: false });

      expect(body.primary_color).toBeNull();
      expect(body.secondary_color).toBeNull();
      expect(body.is_tottenham).toBe(false);
    });

    it('falls back to null/false when the form fields are undefined', async () => {
      const body = await submitAndGetBody({ primary_color: undefined, secondary_color: undefined, is_tottenham: undefined });

      expect(body.primary_color).toBeNull();
      expect(body.secondary_color).toBeNull();
      expect(body.is_tottenham).toBe(false);
    });
  });

  describe('handleTeamSubmit - error reporting', () => {
    it('throws and reports the fallback message when the response is not ok and has no error field (create)', async () => {
      const { showMessage } = await submitWithNotOkResponse({}, false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team: Failed to create team', 'error');
    });

    it('throws and reports the fallback message when the response is not ok and has no error field (edit)', async () => {
      const { showMessage } = await submitWithNotOkResponse({}, true);

      expect(showMessage).toHaveBeenCalledWith('Error updating team: Failed to update team', 'error');
    });

    it('uses the server-provided error message instead of the fallback when present', async () => {
      const { showMessage } = await submitWithNotOkResponse({ error: 'Duplicate short name' }, false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team: Duplicate short name', 'error');
    });

    it('builds the error message from error.code when message is absent (create)', async () => {
      const { showMessage } = await submitWithFetchFailure({ code: 'PGRST001' }, false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team: PGRST001', 'error');
    });

    it('builds the error message from error.code when message is absent (edit)', async () => {
      const { showMessage } = await submitWithFetchFailure({ code: 'PGRST001' }, true);

      expect(showMessage).toHaveBeenCalledWith('Error updating team: PGRST001', 'error');
    });

    it('falls back to JSON.stringify when the error object has neither message nor code (create)', async () => {
      const { showMessage } = await submitWithFetchFailure({ foo: 'bar' }, false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team: {"foo":"bar"}', 'error');
    });

    it('falls back to JSON.stringify when the error object has neither message nor code (edit)', async () => {
      const { showMessage } = await submitWithFetchFailure({ foo: 'bar' }, true);

      expect(showMessage).toHaveBeenCalledWith('Error updating team: {"foo":"bar"}', 'error');
    });

    it('appends the raw error when it is a string (create)', async () => {
      const { showMessage } = await submitWithFetchFailure('plain string failure', false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team: plain string failure', 'error');
    });

    it('appends the raw error when it is a string (edit)', async () => {
      const { showMessage } = await submitWithFetchFailure('plain string failure', true);

      expect(showMessage).toHaveBeenCalledWith('Error updating team: plain string failure', 'error');
    });

    it('uses the generic message when the thrown value is neither an object nor a string (create)', async () => {
      const { showMessage, setLoading } = await submitWithFetchFailure(42, false);

      expect(showMessage).toHaveBeenCalledWith('Error creating team', 'error');
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('uses the generic message when the thrown value is neither an object nor a string (edit)', async () => {
      const { showMessage } = await submitWithFetchFailure(42, true);

      expect(showMessage).toHaveBeenCalledWith('Error updating team', 'error');
    });
  });
});
