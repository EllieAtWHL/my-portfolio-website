import { useCallback, useState } from 'react';
import { useSearchPagination } from '@/hooks/useSearchPagination';
import { callAdminApi } from '@/lib/api-client';
import type { Team } from '@/types/spurs-women-admin';

const TEAMS_PER_PAGE = 20;

const emptyTeamForm: Partial<Team> = {
  name: '',
  short_name: '',
  primary_color: null,
  secondary_color: null,
  is_tottenham: false,
};

interface UseTeamsAdminArgs {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  setLoading: (loading: boolean) => void;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export function useTeamsAdmin({ teams, setTeams, setLoading, showMessage }: UseTeamsAdminArgs) {
  const teamFilterFn = useCallback((team: Team, search: string) => {
    const searchTerm = search.toLowerCase();
    return (
      team.name?.toLowerCase().includes(searchTerm) ||
      team.short_name?.toLowerCase().includes(searchTerm)
    );
  }, []);
  const search = useSearchPagination(teams, teamFilterFn, TEAMS_PER_PAGE);

  const [isTeamEditMode, setIsTeamEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState<Partial<Team>>(emptyTeamForm);

  const handleCancelEditTeam = useCallback(() => {
    setIsTeamEditMode(false);
    setShowTeamForm(false);
    setEditingTeamId(null);
    setTeamForm(emptyTeamForm);
  }, []);

  const handleEditTeam = useCallback((team: Team) => {
    setIsTeamEditMode(true);
    setShowTeamForm(true);
    setEditingTeamId(team.id);
    window.scrollTo({ top: 250, left: 0, behavior: 'smooth' });
    setTeamForm({
      name: team.name,
      short_name: team.short_name,
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
      is_tottenham: team.is_tottenham,
    });
  }, []);

  const handleDeleteTeam = useCallback(async (teamId: number) => {
    setLoading(true);
    try {
      await callAdminApi('teams', 'DELETE', { id: teamId });
      showMessage('Team deleted successfully', 'success');

      try {
        const teamsResponse = await callAdminApi('teams', 'GET');
        if (teamsResponse.data) setTeams(teamsResponse.data as Team[]);
      } catch (error) {
        console.error('Error reloading teams:', error);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showMessage('Error deleting team', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, setTeams]);

  const handleTeamSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: teamForm.name,
        short_name: teamForm.short_name,
        primary_color: teamForm.primary_color || null,
        secondary_color: teamForm.secondary_color || null,
        is_tottenham: teamForm.is_tottenham || false,
      };

      let response;
      if (isTeamEditMode && editingTeamId) {
        response = await fetch('/api/admin/teams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTeamId, ...payload }),
        });
      } else {
        response = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isTeamEditMode ? 'update' : 'create'} team`);
      }

      showMessage(isTeamEditMode ? 'Team updated successfully' : 'Team created successfully', 'success');

      handleCancelEditTeam();

      try {
        const teamsResponse = await fetch('/api/admin/teams');
        const teamsResult = await teamsResponse.json();
        if (teamsResult.data) setTeams(teamsResult.data as Team[]);
      } catch (error) {
        console.error('Error reloading teams:', error);
      }
    } catch (error) {
      console.error(`Error ${isTeamEditMode ? 'updating' : 'creating'} team:`, error);

      let errorMessage = isTeamEditMode ? 'Error updating team' : 'Error creating team';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isTeamEditMode ? 'Error updating team' : 'Error creating team'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isTeamEditMode ? 'Error updating team' : 'Error creating team'}: ${error.code}`;
        } else {
          errorMessage = `${isTeamEditMode ? 'Error updating team' : 'Error creating team'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isTeamEditMode ? 'Error updating team' : 'Error creating team'}: ${error}`;
      }

      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [teamForm, isTeamEditMode, editingTeamId, setLoading, showMessage, handleCancelEditTeam, setTeams]);

  const resetTabState = useCallback(() => {
    setIsTeamEditMode(false);
    setEditingTeamId(null);
    setShowTeamForm(false);
    search.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...search,
    perPage: TEAMS_PER_PAGE,
    isTeamEditMode,
    editingTeamId,
    showTeamForm,
    setShowTeamForm,
    teamForm,
    setTeamForm,
    handleEditTeam,
    handleCancelEditTeam,
    handleDeleteTeam,
    handleTeamSubmit,
    resetTabState,
  };
}
