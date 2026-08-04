import { renderHook, act } from '@testing-library/react';
import { useStadiumsAdmin } from '../useStadiumsAdmin';
import { callAdminApi, createEntityAndReload } from '@/lib/api-client';
import type { Stadium, StadiumName } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
  createEntityAndReload: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;
const mockCreateEntityAndReload = createEntityAndReload as jest.Mock;

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

// Distinct field values (no shared substrings) so search-filter tests can
// disambiguate which field triggered a match.
const otherStadium: Stadium = {
  id: 'stadium-2',
  name: 'Molineux Ground',
  slug: 'wanderers-slug',
  city: 'Wolverhampton',
  country: 'Scotland',
  capacity: 32050,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 2,
};

const stadiumName: StadiumName = {
  id: 'name-1',
  stadium_id: 'stadium-1',
  name: 'Tottenham Hotspur Stadium',
  valid_from: '2019-04-03',
  valid_to: null,
};

const otherStadiumName: StadiumName = {
  id: 'name-2',
  stadium_id: 'stadium-2',
  name: 'Molineux Stadium (old)',
  valid_from: '2000-01-01',
  valid_to: '2019-01-01',
};

const expectedEmptyStadiumForm = {
  name: '',
  slug: '',
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

const expectedEmptyStadiumNameForm = {
  stadium_id: '',
  name: '',
  valid_from: null,
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
    mockCreateEntityAndReload.mockReset();
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with the exact default state', () => {
    const { result } = setup();

    expect(result.current.perPage).toBe(20);
    expect(result.current.isStadiumEditMode).toBe(false);
    expect(result.current.editingStadiumId).toBeNull();
    expect(result.current.showStadiumForm).toBe(false);
    expect(result.current.stadiumEditTab).toBe('details');
    expect(result.current.relatedStadiumNames).toEqual([]);
    expect(result.current.showStadiumNameModal).toBe(false);
    expect(result.current.editingStadiumNameId).toBeNull();
    expect(result.current.stadiumNameFormError).toBeNull();
    expect(result.current.stadiumForm).toEqual(expectedEmptyStadiumForm);
    expect(result.current.stadiumNameForm).toEqual(expectedEmptyStadiumNameForm);
  });

  describe('stadium search filtering', () => {
    it('matches on name only, not other fields (kills case-flip / && mutants)', () => {
      const { result } = setup([stadium, otherStadium]);

      act(() => result.current.setSearch('tottenham hotspur stadium'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([stadium]);
    });

    it('matches on slug only', () => {
      const { result } = setup([stadium, otherStadium]);

      act(() => result.current.setSearch('wanderers-slug'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([otherStadium]);
    });

    it('matches on city only', () => {
      const { result } = setup([stadium, otherStadium]);

      act(() => result.current.setSearch('wolverhampton'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([otherStadium]);
    });

    it('matches on country only', () => {
      const { result } = setup([stadium, otherStadium]);

      act(() => result.current.setSearch('scotland'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([otherStadium]);
    });

    it('excludes items that match nothing', () => {
      const { result } = setup([stadium, otherStadium]);

      act(() => result.current.setSearch('nonexistent-term'));

      expect(result.current.filteredCount).toBe(0);
      expect(result.current.paginatedItems).toEqual([]);
    });

    it('does not throw when name/slug are missing on a record (optional chaining)', () => {
      const malformed = { ...stadium, name: undefined, slug: undefined } as unknown as Stadium;
      const { result } = setup([malformed, otherStadium]);

      let filteredCount = -1;
      expect(() => {
        act(() => result.current.setSearch('wolverhampton'));
        filteredCount = result.current.filteredCount;
      }).not.toThrow();

      expect(filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([otherStadium]);
    });
  });

  describe('handleEditStadium', () => {
    it('populates the form, enters edit mode, scrolls, and fetches related stadium names', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [stadiumName, otherStadiumName] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });

      expect(result.current.isStadiumEditMode).toBe(true);
      expect(result.current.showStadiumForm).toBe(true);
      expect(result.current.editingStadiumId).toBe('stadium-1');
      expect(result.current.stadiumEditTab).toBe('details');
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 250, left: 0, behavior: 'smooth' });
      expect(mockCallAdminApi).toHaveBeenCalledWith('stadium-names', 'GET');
      expect(result.current.stadiumForm).toEqual({
        name: stadium.name,
        slug: stadium.slug,
        city: stadium.city,
        country: stadium.country,
        capacity: stadium.capacity,
        opened_date: stadium.opened_date,
        address_line_1: stadium.address_line_1,
        postcode: stadium.postcode,
        latitude: stadium.latitude,
        longitude: stadium.longitude,
        home_team_id: stadium.home_team_id,
      });
      // Only the stadium name belonging to this stadium should be kept.
      expect(result.current.relatedStadiumNames).toEqual([stadiumName]);
    });

    it('leaves relatedStadiumNames empty when the response has no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({});
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });

      expect(result.current.relatedStadiumNames).toEqual([]);
      // Form population still happens even though the fetch yielded nothing.
      expect(result.current.stadiumForm.name).toBe(stadium.name);
    });

    it('logs and continues (still populates the form) when fetching related names throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('network down'));
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });

      expect(console.error).toHaveBeenCalledWith('Error fetching related records:', expect.any(Error));
      expect(result.current.relatedStadiumNames).toEqual([]);
      expect(result.current.stadiumForm.name).toBe(stadium.name);
      expect(result.current.isStadiumEditMode).toBe(true);
    });
  });

  describe('handleCancelEditStadium', () => {
    it('resets edit mode and the form to the exact empty shape', () => {
      const { result } = setup();

      act(() => result.current.setShowStadiumForm(true));
      act(() => result.current.handleCancelEditStadium());

      expect(result.current.isStadiumEditMode).toBe(false);
      expect(result.current.showStadiumForm).toBe(false);
      expect(result.current.editingStadiumId).toBeNull();
      expect(result.current.stadiumForm).toEqual(expectedEmptyStadiumForm);
    });
  });

  describe('handleDeleteStadium', () => {
    it('deletes a stadium and refreshes both the dropdown and recent lists', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [stadium, otherStadium] }); // reload GET
      const { result, setStadiums, setRecentStadiums, setLoading, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteStadium('stadium-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'stadia', 'DELETE', { id: 'stadium-1' });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'stadia', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Stadium deleted successfully', 'success');
      expect(setStadiums).toHaveBeenCalledWith([stadium, otherStadium]);
      expect(setRecentStadiums).toHaveBeenCalledWith([stadium, otherStadium]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('does not update lists when the reload response has no data', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({}); // reload GET, no data
      const { result, setStadiums, setRecentStadiums } = setup();

      await act(async () => {
        await result.current.handleDeleteStadium('stadium-1');
      });

      expect(setStadiums).not.toHaveBeenCalled();
      expect(setRecentStadiums).not.toHaveBeenCalled();
    });

    it('logs and continues when the reload GET fails but the delete succeeded', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE succeeds
        .mockRejectedValueOnce(new Error('reload failed')); // reload GET fails
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteStadium('stadium-1');
      });

      expect(console.error).toHaveBeenCalledWith('Error reloading stadiums:', expect.any(Error));
      // Success message from the DELETE itself still fires; the outer catch never triggers.
      expect(showMessage).toHaveBeenCalledWith('Stadium deleted successfully', 'success');
      expect(showMessage).not.toHaveBeenCalledWith('Error deleting stadium', 'error');
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('shows an error message and does not reload when the delete itself fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('delete failed'));
      const { result, showMessage, setStadiums, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteStadium('stadium-1');
      });

      expect(console.error).toHaveBeenCalledWith('Error deleting stadium:', expect.any(Error));
      expect(showMessage).toHaveBeenCalledWith('Error deleting stadium', 'error');
      expect(setStadiums).not.toHaveBeenCalled();
      expect(mockCallAdminApi).toHaveBeenCalledTimes(1);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });
  });

  describe('handleStadiumSubmit', () => {
    const filledForm: Partial<Stadium> = {
      name: 'New Stadium',
      slug: 'new-stadium',
      city: 'Leeds',
      country: 'England',
      capacity: 40000,
      opened_date: '2020-01-01',
      address_line_1: '1 Test Street',
      postcode: 'AB1 2CD',
      latitude: 51.5,
      longitude: -0.1,
      home_team_id: 3,
    };
    const expectedPayload = { ...filledForm };
    const fakeEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;

    it('creates a stadium with the exact payload, reloads, and resets the form', async () => {
      mockCreateEntityAndReload.mockResolvedValueOnce(undefined);
      mockCallAdminApi.mockResolvedValueOnce({ data: [stadium, otherStadium] }); // reload GET
      const { result, setStadiums, setRecentStadiums, showMessage, setLoading } = setup();

      act(() => result.current.setStadiumForm(filledForm));
      await act(async () => {
        await result.current.handleStadiumSubmit(fakeEvent);
      });

      expect(mockCreateEntityAndReload).toHaveBeenCalledWith('stadia', expectedPayload, 'stadia', setStadiums);
      expect(showMessage).toHaveBeenCalledWith('Stadium created successfully', 'success');
      expect(mockCallAdminApi).toHaveBeenCalledWith('stadia', 'GET');
      expect(setStadiums).toHaveBeenCalledWith([stadium, otherStadium]);
      expect(setRecentStadiums).toHaveBeenCalledWith([stadium, otherStadium]);
      // handleCancelEditStadium ran afterwards.
      expect(result.current.isStadiumEditMode).toBe(false);
      expect(result.current.showStadiumForm).toBe(false);
      expect(result.current.stadiumForm).toEqual(expectedEmptyStadiumForm);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('shows an error and skips reload/reset when creation fails', async () => {
      mockCreateEntityAndReload.mockRejectedValueOnce(new Error('create failed'));
      const { result, showMessage, setLoading } = setup();

      act(() => result.current.setStadiumForm(filledForm));
      await act(async () => {
        await result.current.handleStadiumSubmit(fakeEvent);
      });

      expect(console.error).toHaveBeenCalledWith('Error saving stadium:', expect.any(Error));
      expect(showMessage).toHaveBeenCalledWith('Error creating stadium', 'error');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
      // handleCancelEditStadium never ran; edit-mode flags are untouched (still initial/false),
      // but the form should NOT have been reset back to empty.
      expect(result.current.stadiumForm).toEqual(expectedPayload);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('updates a stadium via PUT with the exact request, reloads, and resets the form', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // handleEditStadium's related-names GET
        .mockResolvedValueOnce({ data: [stadium] }); // post-submit reload GET
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      const { result, setStadiums, setRecentStadiums, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });
      act(() => result.current.setStadiumForm(filledForm));
      await act(async () => {
        await result.current.handleStadiumSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/stadia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stadium-1', ...expectedPayload }),
      });
      expect(showMessage).toHaveBeenCalledWith('Stadium updated successfully', 'success');
      expect(setStadiums).toHaveBeenCalledWith([stadium]);
      expect(setRecentStadiums).toHaveBeenCalledWith([stadium]);
      expect(result.current.isStadiumEditMode).toBe(false);
      expect(result.current.stadiumForm).toEqual(expectedEmptyStadiumForm);
    });

    it('shows an update error and stays in edit mode when the PUT response is not ok', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }); // handleEditStadium's related-names GET
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });
      act(() => result.current.setStadiumForm(filledForm));
      await act(async () => {
        await result.current.handleStadiumSubmit(fakeEvent);
      });

      expect(console.error).toHaveBeenCalledWith('Error saving stadium:', expect.any(Error));
      expect(showMessage).toHaveBeenCalledWith('Error updating stadium', 'error');
      // Stayed in edit mode; handleCancelEditStadium did not run.
      expect(result.current.isStadiumEditMode).toBe(true);
      expect(result.current.stadiumForm).toEqual(expectedPayload);
    });

    it('still resets the form when the post-submit reload GET fails', async () => {
      mockCreateEntityAndReload.mockResolvedValueOnce(undefined);
      mockCallAdminApi.mockRejectedValueOnce(new Error('reload failed'));
      const { result, setStadiums, showMessage } = setup();

      act(() => result.current.setStadiumForm(filledForm));
      await act(async () => {
        await result.current.handleStadiumSubmit(fakeEvent);
      });

      expect(console.error).toHaveBeenCalledWith('Error reloading stadiums:', expect.any(Error));
      expect(setStadiums).not.toHaveBeenCalled();
      expect(showMessage).toHaveBeenCalledWith('Stadium created successfully', 'success');
      // handleCancelEditStadium still ran despite the inner reload failure.
      expect(result.current.stadiumForm).toEqual(expectedEmptyStadiumForm);
    });
  });

  describe('stadium name modal state helpers', () => {
    it('openEditStadiumName pre-fills the exact record and opens the modal', () => {
      const { result } = setup();

      act(() => result.current.openEditStadiumName(stadiumName));

      expect(result.current.showStadiumNameModal).toBe(true);
      expect(result.current.editingStadiumNameId).toBe('name-1');
      expect(result.current.stadiumNameFormError).toBeNull();
      expect(result.current.stadiumNameForm).toEqual({
        stadium_id: stadiumName.stadium_id,
        name: stadiumName.name,
        valid_from: stadiumName.valid_from,
        valid_to: stadiumName.valid_to,
      });
    });

    it('openNewStadiumName pre-fills a blank form scoped to the stadium being edited', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });
      act(() => result.current.openNewStadiumName());

      expect(result.current.showStadiumNameModal).toBe(true);
      expect(result.current.editingStadiumNameId).toBeNull();
      expect(result.current.stadiumNameFormError).toBeNull();
      expect(result.current.stadiumNameForm).toEqual({
        stadium_id: 'stadium-1',
        name: '',
        valid_from: '',
        valid_to: null,
      });
    });

    it('closeStadiumNameModal resets the modal and form to the exact empty shape', () => {
      const { result } = setup();

      act(() => result.current.openEditStadiumName(stadiumName));
      act(() => result.current.closeStadiumNameModal());

      expect(result.current.showStadiumNameModal).toBe(false);
      expect(result.current.editingStadiumNameId).toBeNull();
      expect(result.current.stadiumNameFormError).toBeNull();
      expect(result.current.stadiumNameForm).toEqual({
        stadium_id: '',
        name: '',
        valid_from: '',
        valid_to: null,
      });
    });
  });

  describe('handleDeleteStadiumName', () => {
    it('deletes a stadium name, refreshes the global cache, and filters related names to this stadium', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // handleEditStadium related-names GET
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [stadiumName, otherStadiumName] }); // reload GET
      const { result, setStadiumNames, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium); // sets editingStadiumId = 'stadium-1'
      });
      await act(async () => {
        await result.current.handleDeleteStadiumName('name-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'stadium-names', 'DELETE', { id: 'name-1' });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(3, 'stadium-names', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Stadium name deleted successfully', 'success');
      // Unfiltered list goes to the global cache setter...
      expect(setStadiumNames).toHaveBeenCalledWith([stadiumName, otherStadiumName]);
      // ...but only the match for the stadium being edited goes to relatedStadiumNames.
      expect(result.current.relatedStadiumNames).toEqual([stadiumName]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('logs and continues when the reload GET fails but the delete succeeded', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockRejectedValueOnce(new Error('reload failed')); // reload GET
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteStadiumName('name-1');
      });

      expect(console.error).toHaveBeenCalledWith('Error reloading stadium names:', expect.any(Error));
      expect(showMessage).toHaveBeenCalledWith('Stadium name deleted successfully', 'success');
      expect(showMessage).not.toHaveBeenCalledWith('Error deleting stadium name', 'error');
    });

    it('shows an error message when the delete itself fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('delete failed'));
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteStadiumName('name-1');
      });

      expect(console.error).toHaveBeenCalledWith('Error deleting stadium name:', expect.any(Error));
      expect(showMessage).toHaveBeenCalledWith('Error deleting stadium name', 'error');
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });
  });

  describe('handleStadiumNameSubmit', () => {
    it('requires a valid_from date before submitting', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.stadiumNameFormError).toBe('Valid From is required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });

    it('creates a new stadium name with the exact payload (coercing a blank valid_to to null), reloads, and closes the modal', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // handleEditStadium related-names GET
        .mockResolvedValueOnce({}) // POST, no error
        .mockResolvedValueOnce({ data: [stadiumName, otherStadiumName] }); // reload GET
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleEditStadium(stadium); // editingStadiumId = 'stadium-1'
      });
      act(() => result.current.setStadiumNameForm({ stadium_id: 'stadium-1', name: 'New Name', valid_from: '2021-01-01', valid_to: '' }));

      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'stadium-names', 'POST', {
        stadium_id: 'stadium-1',
        name: 'New Name',
        valid_from: '2021-01-01',
        valid_to: null,
      });
      expect(showMessage).toHaveBeenCalledWith('Stadium name created successfully', 'success');
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(3, 'stadium-names', 'GET');
      // Modal closed (closeStadiumNameModal ran).
      expect(result.current.showStadiumNameModal).toBe(false);
      // Reload filtered down to the stadium being edited.
      expect(result.current.relatedStadiumNames).toEqual([stadiumName]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('preserves a truthy valid_to value in the payload', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // POST
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result } = setup();

      act(() => result.current.setStadiumNameForm({ stadium_id: '', name: 'New Name', valid_from: '2021-01-01', valid_to: '2022-01-01' }));
      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'stadium-names', 'POST', {
        stadium_id: '',
        name: 'New Name',
        valid_from: '2021-01-01',
        valid_to: '2022-01-01',
      });
    });

    it('updates an existing stadium name via PUT with the id merged in', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // PUT
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result, showMessage } = setup();

      act(() => result.current.openEditStadiumName(stadiumName)); // editingStadiumNameId = 'name-1'
      act(() => result.current.setStadiumNameForm({ ...stadiumName, valid_from: '2021-01-01' }));

      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'stadium-names', 'PUT', {
        id: 'name-1',
        stadium_id: stadiumName.stadium_id,
        name: stadiumName.name,
        valid_from: '2021-01-01',
        valid_to: stadiumName.valid_to,
      });
      expect(showMessage).toHaveBeenCalledWith('Stadium name updated successfully', 'success');
    });

    it('sets the form error and keeps the modal open when the API returns an error', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ error: 'Name already exists' });
      const { result } = setup();

      act(() => result.current.setStadiumNameForm({ stadium_id: '', name: 'Dup', valid_from: '2021-01-01', valid_to: null }));
      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.stadiumNameFormError).toBe('Name already exists');
      // Modal was NOT closed since we took the error branch.
      expect(mockCallAdminApi).toHaveBeenCalledTimes(1);
    });

    it('does not overwrite relatedStadiumNames when the reload response has no data', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // POST
        .mockResolvedValueOnce({}); // reload GET, no data
      const { result } = setup();

      act(() => result.current.setStadiumNameForm({ stadium_id: '', name: 'New Name', valid_from: '2021-01-01', valid_to: null }));
      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.relatedStadiumNames).toEqual([]);
    });

    it('sets a distinct create-vs-update error message and logs when the API call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result, setLoading } = setup();

      act(() => result.current.setStadiumNameForm({ stadium_id: '', name: 'New Name', valid_from: '2021-01-01', valid_to: null }));
      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.stadiumNameFormError).toBe('Error creating stadium name');
      expect(console.error).toHaveBeenCalledWith('Error saving stadium name:', expect.any(Error));
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('sets the update-specific error message when editing an existing record and the API call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result } = setup();

      act(() => result.current.openEditStadiumName(stadiumName));
      act(() => result.current.setStadiumNameForm({ ...stadiumName, valid_from: '2021-01-01' }));
      await act(async () => {
        await result.current.handleStadiumNameSubmit();
      });

      expect(result.current.stadiumNameFormError).toBe('Error updating stadium name');
    });
  });

  describe('resetTabState', () => {
    it('resets edit-mode flags and pagination back to defaults', async () => {
      const manyStadiums: Stadium[] = Array.from({ length: 25 }, (_, i) => ({
        ...stadium,
        id: `stadium-${i}`,
        name: `Stadium ${i}`,
        slug: `stadium-${i}`,
      }));
      mockCallAdminApi.mockResolvedValueOnce({ data: [] });
      const { result } = setup(manyStadiums);

      await act(async () => {
        await result.current.handleEditStadium(stadium);
      });
      act(() => result.current.setCurrentPage(2));

      expect(result.current.isStadiumEditMode).toBe(true);
      expect(result.current.currentPage).toBe(2);

      act(() => result.current.resetTabState());

      expect(result.current.isStadiumEditMode).toBe(false);
      expect(result.current.editingStadiumId).toBeNull();
      expect(result.current.showStadiumForm).toBe(false);
      expect(result.current.currentPage).toBe(1);
    });
  });
});
