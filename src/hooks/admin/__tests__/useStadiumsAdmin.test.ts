import { renderHook, act } from '@testing-library/react';
import { useStadiumsAdmin } from '../useStadiumsAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Stadium, StadiumName } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
  createEntityAndReload: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

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

const stadiumName: StadiumName = {
  id: 'name-1',
  stadium_id: 'stadium-1',
  name: 'Tottenham Hotspur Stadium',
  valid_from: '2019-04-03',
  valid_to: null,
};

function setup(recentStadiums: Stadium[] = [stadium]) {
  const setStadiums = jest.fn();
  const setRecentStadiums = jest.fn();
  const setStadiumNames = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() =>
    useStadiumsAdmin({ recentStadiums, setStadiums, setRecentStadiums, setStadiumNames, setLoading, showMessage })
  );
  return { result, setStadiums, setRecentStadiums, setStadiumNames, setLoading, showMessage };
}

describe('useStadiumsAdmin', () => {
  beforeEach(() => {
    mockCallAdminApi.mockReset();
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
  });

  it('populates the form and fetches related stadium names when editing', async () => {
    mockCallAdminApi.mockResolvedValueOnce({ data: [stadiumName] });
    const { result } = setup();

    await act(async () => {
      await result.current.handleEditStadium(stadium);
    });

    expect(result.current.isStadiumEditMode).toBe(true);
    expect(result.current.stadiumForm.name).toBe('Tottenham Hotspur Stadium');
    expect(result.current.relatedStadiumNames).toEqual([stadiumName]);
  });

  it('resets edit mode on cancel', () => {
    const { result } = setup();

    act(() => result.current.setShowStadiumForm(true));
    act(() => result.current.handleCancelEditStadium());

    expect(result.current.isStadiumEditMode).toBe(false);
    expect(result.current.showStadiumForm).toBe(false);
    expect(result.current.stadiumForm.name).toBe('');
  });

  it('deletes a stadium and refreshes both the dropdown and recent lists', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({ data: [] }); // reload GET
    const { result, setStadiums, setRecentStadiums, showMessage } = setup();

    await act(async () => {
      await result.current.handleDeleteStadium('stadium-1');
    });

    expect(showMessage).toHaveBeenCalledWith('Stadium deleted successfully', 'success');
    expect(setStadiums).toHaveBeenCalledWith([]);
    expect(setRecentStadiums).toHaveBeenCalledWith([]);
  });

  describe('stadium name modal', () => {
    it('opens pre-filled with the selected record', () => {
      const { result } = setup();

      act(() => result.current.openEditStadiumName(stadiumName));

      expect(result.current.showStadiumNameModal).toBe(true);
      expect(result.current.editingStadiumNameId).toBe('name-1');
      expect(result.current.stadiumNameForm.name).toBe('Tottenham Hotspur Stadium');
    });

    it('requires a valid_from date before submitting', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.stadiumNameFormError).toBe('Valid From is required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });

    it('deletes a stadium name and refreshes the global stadiumNames cache', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [stadiumName] }); // reload GET
      const { result, setStadiumNames, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteStadiumName('name-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Stadium name deleted successfully', 'success');
      expect(setStadiumNames).toHaveBeenCalledWith([stadiumName]);
    });
  });

  it('filters and paginates the passed-in recentStadiums list', () => {
    const wembley: Stadium = { ...stadium, id: 'stadium-2', name: 'Wembley Stadium', slug: 'wembley', city: 'London' };
    const { result } = setup([stadium, wembley]);

    act(() => result.current.setSearch('wembley'));

    expect(result.current.filteredCount).toBe(1);
    expect(result.current.paginatedItems).toEqual([wembley]);
  });
});
