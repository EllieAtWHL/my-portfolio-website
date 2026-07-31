import { useCallback, useState } from 'react';
import { useSearchPagination } from '@/hooks/useSearchPagination';
import { callAdminApi } from '@/lib/api-client';
import { buildMatchPayload } from '@/lib/admin-match-payload';
import { getCurrentStadiumName } from '@/lib/admin-stadium-names';
import type { Match, Media, PlayerStats, Team, Stadium, StadiumName } from '@/types/spurs-women-admin';

const MATCHES_PER_PAGE = 20;

const emptyMatchForm: Partial<Match> = {
  season_id: '',
  competition_id: '',
  date: '',
  kickoff_time: '',
  is_home_match: true,
  spurs_score: null,
  opponent_score: null,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  stadium_id: '',
  attended: false,
  notes: '',
  home_team_id: 1,
  away_team_id: 1,
  attendance: null,
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
};

const emptyMediaForm: Partial<Media> = {
  match_id: '',
  type: 'social media',
  title: '',
  url: '',
  caption: '',
  sort_order: 0,
};

interface UseMatchesAdminArgs {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  teams: Team[];
  stadiums: Stadium[];
  stadiumNames: StadiumName[];
  setLoading: (loading: boolean) => void;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export function useMatchesAdmin({ matches, setMatches, teams, stadiums, stadiumNames, setLoading, showMessage }: UseMatchesAdminArgs) {
  const matchFilterFn = useCallback(
    (match: Match, search: string) => {
      const searchTerm = search.toLowerCase();
      const homeTeam = teams.find(t => t.id === match.home_team_id);
      const awayTeam = teams.find(t => t.id === match.away_team_id);
      const homeTeamShortName = homeTeam?.short_name || '';
      const homeTeamFullName = homeTeam?.name || '';
      const awayTeamShortName = awayTeam?.short_name || '';
      const awayTeamFullName = awayTeam?.name || '';
      return (
        match.date?.toLowerCase().includes(searchTerm) ||
        homeTeamShortName.toLowerCase().includes(searchTerm) ||
        homeTeamFullName.toLowerCase().includes(searchTerm) ||
        awayTeamShortName.toLowerCase().includes(searchTerm) ||
        awayTeamFullName.toLowerCase().includes(searchTerm) ||
        match.stadium_display_name?.toLowerCase().includes(searchTerm)
      );
    },
    [teams]
  );
  const search = useSearchPagination(matches, matchFilterFn, MATCHES_PER_PAGE);

  const resolveStadiumName = useCallback(
    (stadiumId: string, matchDate: string) => getCurrentStadiumName(stadiums, stadiumNames, stadiumId, matchDate),
    [stadiums, stadiumNames]
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState<Partial<Match>>(emptyMatchForm);
  const [matchEditTab, setMatchEditTab] = useState<'details' | 'related'>('details');
  const [showExtraTimeSection, setShowExtraTimeSection] = useState(false);
  const [showStatsSection, setShowStatsSection] = useState(false);

  const [relatedMedia, setRelatedMedia] = useState<Media[]>([]);
  const [relatedPlayerStats, setRelatedPlayerStats] = useState<PlayerStats[]>([]);

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [newMediaForm, setNewMediaForm] = useState<Partial<Media>>(emptyMediaForm);

  const getMediaByType = useCallback(() => {
    const grouped: Record<string, Media[]> = {
      'photo': [],
      'photo album': [],
      'article': [],
      'social media': [],
      'video-external': [],
    };
    relatedMedia.forEach(media => {
      if (grouped[media.type]) {
        grouped[media.type].push(media);
      }
    });
    return grouped;
  }, [relatedMedia]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setShowMatchForm(false);
    setEditingMatchId(null);
    setShowExtraTimeSection(false);
    setShowStatsSection(false);
    setMatchForm(emptyMatchForm);
  }, []);

  const handleEditMatch = useCallback(async (match: Match) => {
    setIsEditMode(true);
    setShowMatchForm(true);
    setEditingMatchId(match.id);
    setMatchEditTab('details');
    window.scrollTo({ top: 250, left: 0, behavior: 'smooth' });

    // Try to match the stadium by comparing stadium_id with stadium_display_name
    const matchedStadium = stadiums.find(s => {
      const currentName = resolveStadiumName(s.id, match.date);
      const displayNameLower = match.stadium_display_name?.toLowerCase() || '';
      const currentNameLower = currentName.toLowerCase();

      return (
        s.id === match.stadium_id ||
        currentName === match.stadium_display_name ||
        currentNameLower === displayNameLower ||
        displayNameLower.includes(currentNameLower) ||
        currentNameLower.includes(displayNameLower)
      );
    });

    const stadiumIdValue = matchedStadium ? matchedStadium.id : match.stadium_id || '';

    setMatchForm({
      season_id: match.season_id,
      competition_id: match.competition_id,
      date: match.date,
      kickoff_time: match.kickoff_time || '',
      is_home_match: match.is_home_match,
      spurs_score: match.spurs_score,
      opponent_score: match.opponent_score,
      spurs_score_aet: match.spurs_score_aet,
      opponent_score_aet: match.opponent_score_aet,
      spurs_score_pens: match.spurs_score_pens,
      opponent_score_pens: match.opponent_score_pens,
      stadium_id: stadiumIdValue,
      attended: match.attended,
      notes: match.notes || '',
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      attendance: match.attendance,
      home_possession: match.home_possession,
      away_possession: match.away_possession,
      home_total_shots: match.home_total_shots,
      away_total_shots: match.away_total_shots,
      home_shots_on_target: match.home_shots_on_target,
      away_shots_on_target: match.away_shots_on_target,
      home_corners: match.home_corners,
      away_corners: match.away_corners,
    });

    try {
      const [mediaRes, playerStatsRes] = await Promise.all([
        callAdminApi('media', 'GET'),
        callAdminApi('player-stats', 'GET'),
      ]);

      if (mediaRes.data) {
        const allMedia = mediaRes.data as Media[];
        setRelatedMedia(allMedia.filter(m => m.match_id === match.id));
      }

      if (playerStatsRes.data) {
        const allPlayerStats = playerStatsRes.data as PlayerStats[];
        setRelatedPlayerStats(allPlayerStats.filter(ps => ps.match_id === match.id));
      }
    } catch (error) {
      console.error('Error fetching related records:', error);
    }
  }, [stadiums, resolveStadiumName]);

  const handleDeleteMatch = useCallback(async (matchId: string) => {
    setLoading(true);
    try {
      await callAdminApi('matches', 'DELETE', { id: matchId });
      showMessage('Match deleted successfully', 'success');

      try {
        const matchesResponse = await callAdminApi('matches', 'GET');
        if (matchesResponse.data) setMatches(matchesResponse.data as Match[]);
      } catch (error) {
        console.error('Error reloading matches:', error);
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      showMessage('Error deleting match', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, setMatches]);

  const handleMatchSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const spursTeam = teams.find(t => t.is_tottenham);
      if (!spursTeam) {
        showMessage('Tottenham team not found', 'error');
        return;
      }

      if (!matchForm.season_id || !matchForm.competition_id || !matchForm.date || !matchForm.away_team_id) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      const payload = buildMatchPayload(matchForm, spursTeam);

      let response;
      if (isEditMode && editingMatchId) {
        response = await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMatchId, ...payload }),
        });
      } else {
        response = await fetch('/api/admin/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} match`);
      }

      showMessage(isEditMode ? 'Match updated successfully' : 'Match created successfully', 'success');

      handleCancelEdit();

      try {
        const matchesResponse = await fetch('/api/admin/matches');
        const matchesResult = await matchesResponse.json();
        if (matchesResult.data) setMatches(matchesResult.data as Match[]);
      } catch (error) {
        console.error('Error reloading matches:', error);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} match:`, error);

      let errorMessage = isEditMode ? 'Error updating match' : 'Error creating match';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isEditMode ? 'Error updating match' : 'Error creating match'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isEditMode ? 'Error updating match' : 'Error creating match'}: ${error.code}`;
        } else {
          errorMessage = `${isEditMode ? 'Error updating match' : 'Error creating match'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isEditMode ? 'Error updating match' : 'Error creating match'}: ${error}`;
      }

      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [matchForm, isEditMode, editingMatchId, teams, setLoading, showMessage, handleCancelEdit, setMatches]);

  const closeMediaModal = useCallback(() => {
    setShowMediaModal(false);
    setEditingMediaId(null);
    setNewMediaForm(emptyMediaForm);
  }, []);

  const openNewMedia = useCallback((mediaType: Media['type']) => {
    setNewMediaForm({ match_id: editingMatchId!, type: mediaType, title: '', url: '', caption: '', sort_order: 0 });
    setShowMediaModal(true);
  }, [editingMatchId]);

  const openEditMedia = useCallback((media: Media) => {
    setEditingMediaId(media.id);
    setNewMediaForm({
      match_id: media.match_id,
      type: media.type,
      title: media.title || '',
      url: media.url || '',
      caption: media.caption || '',
      sort_order: media.sort_order || 0,
    });
    setShowMediaModal(true);
  }, []);

  const handleDeleteMedia = useCallback(async (mediaId: string) => {
    setLoading(true);
    try {
      await callAdminApi('media', 'DELETE', { id: mediaId });
      showMessage('Media deleted successfully', 'success');

      try {
        const mediaResponse = await callAdminApi('media', 'GET');
        if (mediaResponse.data) {
          const allMedia = mediaResponse.data as Media[];
          setRelatedMedia(allMedia.filter(m => m.match_id === editingMatchId));
        }
      } catch (error) {
        console.error('Error reloading media:', error);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      showMessage('Error deleting media', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, editingMatchId]);

  const handleMediaSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const response = editingMediaId
        ? await callAdminApi('media', 'PUT', { id: editingMediaId, ...newMediaForm })
        : await callAdminApi('media', 'POST', newMediaForm);
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage(editingMediaId ? 'Media updated successfully' : 'Media created successfully', 'success');
        closeMediaModal();
        const mediaRes = await callAdminApi('media', 'GET');
        if (mediaRes.data) {
          const allMedia = mediaRes.data as Media[];
          setRelatedMedia(allMedia.filter(m => m.match_id === editingMatchId));
        }
      }
    } catch (error) {
      showMessage(editingMediaId ? 'Error updating media' : 'Error creating media', 'error');
      console.error('Error saving media:', error);
    } finally {
      setLoading(false);
    }
  }, [editingMediaId, newMediaForm, setLoading, showMessage, closeMediaModal, editingMatchId]);

  const resetTabState = useCallback(() => {
    setIsEditMode(false);
    setEditingMatchId(null);
    setShowMatchForm(false);
    search.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...search,
    perPage: MATCHES_PER_PAGE,
    isEditMode,
    editingMatchId,
    showMatchForm,
    setShowMatchForm,
    matchForm,
    setMatchForm,
    matchEditTab,
    setMatchEditTab,
    showExtraTimeSection,
    setShowExtraTimeSection,
    showStatsSection,
    setShowStatsSection,
    relatedMedia,
    relatedPlayerStats,
    setRelatedPlayerStats,
    getMediaByType,
    getCurrentStadiumName: resolveStadiumName,
    handleEditMatch,
    handleCancelEdit,
    handleDeleteMatch,
    handleMatchSubmit,
    resetTabState,
    // Media modal
    showMediaModal,
    editingMediaId,
    newMediaForm,
    setNewMediaForm,
    openNewMedia,
    openEditMedia,
    closeMediaModal,
    handleDeleteMedia,
    handleMediaSubmit,
  };
}
