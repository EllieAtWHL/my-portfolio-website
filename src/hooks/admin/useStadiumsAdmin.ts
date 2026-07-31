import { useCallback, useState } from 'react';
import { useSearchPagination } from '@/hooks/useSearchPagination';
import { callAdminApi, createEntityAndReload } from '@/lib/api-client';
import type { Stadium, StadiumName } from '@/types/spurs-women-admin';

const STADIUMS_PER_PAGE = 20;

const emptyStadiumForm: Partial<Stadium> = {
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

const emptyStadiumNameForm: Partial<StadiumName> = {
  stadium_id: '',
  name: '',
  valid_from: null,
  valid_to: null,
};

interface UseStadiumsAdminArgs {
  recentStadiums: Stadium[];
  setStadiums: (stadiums: Stadium[]) => void;
  setRecentStadiums: (stadiums: Stadium[]) => void;
  setStadiumNames: (stadiumNames: StadiumName[]) => void;
  setLoading: (loading: boolean) => void;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export function useStadiumsAdmin({ recentStadiums, setStadiums, setRecentStadiums, setStadiumNames, setLoading, showMessage }: UseStadiumsAdminArgs) {
  const stadiumFilterFn = useCallback((stadium: Stadium, search: string) => {
    const searchTerm = search.toLowerCase();
    return (
      stadium.name?.toLowerCase().includes(searchTerm) ||
      stadium.slug?.toLowerCase().includes(searchTerm) ||
      stadium.city?.toLowerCase().includes(searchTerm) ||
      stadium.country?.toLowerCase().includes(searchTerm)
    );
  }, []);
  const search = useSearchPagination(recentStadiums, stadiumFilterFn, STADIUMS_PER_PAGE);

  const [isStadiumEditMode, setIsStadiumEditMode] = useState(false);
  const [editingStadiumId, setEditingStadiumId] = useState<string | null>(null);
  const [showStadiumForm, setShowStadiumForm] = useState(false);
  const [stadiumForm, setStadiumForm] = useState<Partial<Stadium>>(emptyStadiumForm);
  const [stadiumEditTab, setStadiumEditTab] = useState<'details' | 'related'>('details');

  const [relatedStadiumNames, setRelatedStadiumNames] = useState<StadiumName[]>([]);

  const [showStadiumNameModal, setShowStadiumNameModal] = useState(false);
  const [editingStadiumNameId, setEditingStadiumNameId] = useState<string | null>(null);
  const [stadiumNameForm, setStadiumNameForm] = useState<Partial<StadiumName>>(emptyStadiumNameForm);
  const [stadiumNameFormError, setStadiumNameFormError] = useState<string | null>(null);

  const handleCancelEditStadium = useCallback(() => {
    setIsStadiumEditMode(false);
    setShowStadiumForm(false);
    setEditingStadiumId(null);
    setStadiumForm(emptyStadiumForm);
  }, []);

  const handleEditStadium = useCallback(async (stadium: Stadium) => {
    setIsStadiumEditMode(true);
    setShowStadiumForm(true);
    setEditingStadiumId(stadium.id);
    setStadiumEditTab('details');
    window.scrollTo({ top: 250, left: 0, behavior: 'smooth' });

    try {
      const stadiumNamesRes = await callAdminApi('stadium-names', 'GET');
      if (stadiumNamesRes.data) {
        const allStadiumNames = stadiumNamesRes.data as StadiumName[];
        setRelatedStadiumNames(allStadiumNames.filter(sn => sn.stadium_id === stadium.id));
      }
    } catch (error) {
      console.error('Error fetching related records:', error);
    }
    setStadiumForm({
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
  }, []);

  const handleDeleteStadium = useCallback(async (stadiumId: string) => {
    setLoading(true);
    try {
      await callAdminApi('stadia', 'DELETE', { id: stadiumId });
      showMessage('Stadium deleted successfully', 'success');

      try {
        const stadiumsResponse = await callAdminApi('stadia', 'GET');
        if (stadiumsResponse.data) {
          setStadiums(stadiumsResponse.data as Stadium[]);
          setRecentStadiums(stadiumsResponse.data as Stadium[]);
        }
      } catch (error) {
        console.error('Error reloading stadiums:', error);
      }
    } catch (error) {
      console.error('Error deleting stadium:', error);
      showMessage('Error deleting stadium', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, setStadiums, setRecentStadiums]);

  const handleStadiumSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: stadiumForm.name,
        slug: stadiumForm.slug,
        city: stadiumForm.city,
        country: stadiumForm.country,
        capacity: stadiumForm.capacity,
        opened_date: stadiumForm.opened_date,
        address_line_1: stadiumForm.address_line_1,
        postcode: stadiumForm.postcode,
        latitude: stadiumForm.latitude,
        longitude: stadiumForm.longitude,
        home_team_id: stadiumForm.home_team_id,
      };

      if (isStadiumEditMode && editingStadiumId) {
        const response = await fetch('/api/admin/stadia', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingStadiumId, ...payload }),
        });
        if (!response.ok) {
          throw new Error('Failed to update stadium');
        }
        showMessage('Stadium updated successfully', 'success');
      } else {
        await createEntityAndReload('stadia', payload, 'stadia', setStadiums);
        showMessage('Stadium created successfully', 'success');
      }

      try {
        const stadiumsRes = await callAdminApi('stadia', 'GET');
        if (stadiumsRes.data) {
          setStadiums(stadiumsRes.data as Stadium[]);
          setRecentStadiums(stadiumsRes.data as Stadium[]);
        }
      } catch (error) {
        console.error('Error reloading stadiums:', error);
      }

      handleCancelEditStadium();
    } catch (error) {
      showMessage(isStadiumEditMode ? 'Error updating stadium' : 'Error creating stadium', 'error');
      console.error('Error saving stadium:', error);
    } finally {
      setLoading(false);
    }
  }, [stadiumForm, isStadiumEditMode, editingStadiumId, setLoading, showMessage, setStadiums, setRecentStadiums, handleCancelEditStadium]);

  const closeStadiumNameModal = useCallback(() => {
    setShowStadiumNameModal(false);
    setEditingStadiumNameId(null);
    setStadiumNameFormError(null);
    setStadiumNameForm({ stadium_id: '', name: '', valid_from: '', valid_to: null });
  }, []);

  const openNewStadiumName = useCallback(() => {
    setStadiumNameForm({ stadium_id: editingStadiumId!, name: '', valid_from: '', valid_to: null });
    setEditingStadiumNameId(null);
    setStadiumNameFormError(null);
    setShowStadiumNameModal(true);
  }, [editingStadiumId]);

  const openEditStadiumName = useCallback((stadiumName: StadiumName) => {
    setEditingStadiumNameId(stadiumName.id);
    setStadiumNameForm({
      stadium_id: stadiumName.stadium_id,
      name: stadiumName.name,
      valid_from: stadiumName.valid_from,
      valid_to: stadiumName.valid_to,
    });
    setStadiumNameFormError(null);
    setShowStadiumNameModal(true);
  }, []);

  const handleDeleteStadiumName = useCallback(async (stadiumNameId: string) => {
    setLoading(true);
    try {
      await callAdminApi('stadium-names', 'DELETE', { id: stadiumNameId });
      showMessage('Stadium name deleted successfully', 'success');

      try {
        const stadiumNamesResponse = await callAdminApi('stadium-names', 'GET');
        if (stadiumNamesResponse.data) {
          const allStadiumNames = stadiumNamesResponse.data as StadiumName[];
          setStadiumNames(allStadiumNames);
          setRelatedStadiumNames(allStadiumNames.filter(sn => sn.stadium_id === editingStadiumId));
        }
      } catch (error) {
        console.error('Error reloading stadium names:', error);
      }
    } catch (error) {
      console.error('Error deleting stadium name:', error);
      showMessage('Error deleting stadium name', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, setStadiumNames, editingStadiumId]);

  const handleStadiumNameSubmit = useCallback(async () => {
    if (!stadiumNameForm.valid_from) {
      setStadiumNameFormError('Valid From is required');
      return;
    }
    try {
      setLoading(true);
      setStadiumNameFormError(null);
      const payload = {
        ...stadiumNameForm,
        valid_to: stadiumNameForm.valid_to || null,
      };
      const response = editingStadiumNameId
        ? await callAdminApi('stadium-names', 'PUT', { id: editingStadiumNameId, ...payload })
        : await callAdminApi('stadium-names', 'POST', payload);
      if (response.error) {
        setStadiumNameFormError(response.error);
      } else {
        showMessage(editingStadiumNameId ? 'Stadium name updated successfully' : 'Stadium name created successfully', 'success');
        closeStadiumNameModal();
        const stadiumNamesRes = await callAdminApi('stadium-names', 'GET');
        if (stadiumNamesRes.data) {
          const allStadiumNames = stadiumNamesRes.data as StadiumName[];
          setRelatedStadiumNames(allStadiumNames.filter(sn => sn.stadium_id === editingStadiumId));
        }
      }
    } catch (error) {
      setStadiumNameFormError(editingStadiumNameId ? 'Error updating stadium name' : 'Error creating stadium name');
      console.error('Error saving stadium name:', error);
    } finally {
      setLoading(false);
    }
  }, [stadiumNameForm, editingStadiumNameId, editingStadiumId, setLoading, showMessage, closeStadiumNameModal]);

  const resetTabState = useCallback(() => {
    setIsStadiumEditMode(false);
    setEditingStadiumId(null);
    setShowStadiumForm(false);
    search.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...search,
    perPage: STADIUMS_PER_PAGE,
    isStadiumEditMode,
    editingStadiumId,
    showStadiumForm,
    setShowStadiumForm,
    stadiumForm,
    setStadiumForm,
    stadiumEditTab,
    setStadiumEditTab,
    relatedStadiumNames,
    handleEditStadium,
    handleCancelEditStadium,
    handleDeleteStadium,
    handleStadiumSubmit,
    resetTabState,
    // Stadium name modal
    showStadiumNameModal,
    editingStadiumNameId,
    stadiumNameForm,
    setStadiumNameForm,
    stadiumNameFormError,
    openNewStadiumName,
    openEditStadiumName,
    closeStadiumNameModal,
    handleDeleteStadiumName,
    handleStadiumNameSubmit,
  };
}
