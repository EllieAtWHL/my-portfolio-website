'use client';

import { useState, useEffect, useCallback } from 'react';
import { callAdminApi, createEntityAndReload } from '@/lib/api-client';
import { getTeamColor } from '@/lib/utils/team-colors';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

// Types for our data
interface Team {
  id: number;
  name: string;
  short_name: string;
  is_tottenham: boolean;
  primary_color: string | null;
  secondary_color: string | null;
}

interface Competition {
  id: string;
  name: string;
  type: string;
  nickname: string;
}

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Match {
  id: string;
  season_id: string;
  competition_id: string;
  date: string;
  kickoff_time: string;
  is_home_match: boolean;
  spurs_score: number | null;
  opponent_score: number | null;
  spurs_score_aet: number | null;
  opponent_score_aet: number | null;
  spurs_score_pens: number | null;
  opponent_score_pens: number | null;
  venue: string;
  stadium_display_name: string | null;
  attended: boolean;
  notes: string;
  home_team_id: number;
  away_team_id: number;
  attendance: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_total_shots: number | null;
  away_total_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
}

interface Media {
  id: string;
  match_id: string;
  type: 'photo' | 'photo album' | 'article' | 'social media' | 'video-external';
  title: string | null;
  url: string;
  caption: string | null;
  sort_order: number;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  is_active: boolean;
}

interface PlayerStats {
  id: string;
  player_id: string;
  match_id: string;
  team_id: number;
  started: boolean;
  captain: boolean;
  was_substitute: boolean;
  was_unused_substitute: boolean;
  minute_on: number | null;
  minute_off: number | null;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheet: boolean | null;
  saves: number | null;
  shots: number;
  shots_on_target: number;
  passes_completed: number | null;
  passes_attempted: number | null;
  tackles: number | null;
  interceptions: number | null;
  clearances: number | null;
  fouls_committed: number | null;
  fouls_won: number | null;
  offsides: number | null;
  player_rating: number | null;
  player_of_the_match: boolean;
}

interface PlayerHistory {
  id: string;
  player_id: string;
  team_id: number;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
  position: string | null;
}

interface Stadium {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  opened_date: string | null;
  address_line_1: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  home_team_id: number | null;
}

interface StadiumName {
  id: string;
  stadium_id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'media' | 'teams' | 'players' | 'player_stats' | 'player_history' | 'stadiums' | 'stadium_names'>('matches');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Dropdown data
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [stadiumNames, setStadiumNames] = useState<StadiumName[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Recent records for each entity type
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [recentPlayerStats, setRecentPlayerStats] = useState<PlayerStats[]>([]);
  const [recentPlayerHistory, setRecentPlayerHistory] = useState<PlayerHistory[]>([]);
  const [recentStadiums, setRecentStadiums] = useState<Stadium[]>([]);
  const [recentStadiumNames, setRecentStadiumNames] = useState<StadiumName[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const recordsPerPage = 20;

  // Matches-specific pagination state
  const [matchesCurrentPage, setMatchesCurrentPage] = useState(1);
  const [matchesTotalPages, setMatchesTotalPages] = useState(1);
  const matchesPerPage = 20;

  // Search state for matches
  const [matchSearch, setMatchSearch] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // Collapsible section state
  const [showExtraTimeSection, setShowExtraTimeSection] = useState(false);
  const [showStatsSection, setShowStatsSection] = useState(false);

  // Form states
  const [matchForm, setMatchForm] = useState<Partial<Match>>({
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
    venue: '',
    attended: false,
    notes: '',
    home_team_id: 1, // Default to Tottenham
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
  });

  const [mediaForm, setMediaForm] = useState<Partial<Media>>({
    match_id: '',
    type: 'social media',
    title: '',
    url: '',
    caption: '',
    sort_order: 0,
  });

  // Season filter states
  const [playerStatsSeason, setPlayerStatsSeason] = useState('');
  const [mediaSeason, setMediaSeason] = useState('');

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email! });
      }
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Helper function to get current stadium display name based on date
  const getCurrentStadiumName = (stadiumId: string, matchDate: string): string => {
    const stadium = stadiums.find(s => s.id === stadiumId);
    if (!stadium) return '';
    
    // Find stadium names that were valid on the match date
    const validNames = stadiumNames.filter(sn => {
      if (sn.stadium_id !== stadiumId) return false;
      
      const validFrom = sn.valid_from ? new Date(sn.valid_from) : null;
      const validTo = sn.valid_to ? new Date(sn.valid_to) : null;
      const matchDateTime = new Date(matchDate);
      
      // Check if match date falls within the validity period
      if (validFrom && matchDateTime < validFrom) return false;
      if (validTo && matchDateTime > validTo) return false;
      
      return true;
    });
    
    // Return the most recent valid name, or fall back to base stadium name
    if (validNames.length > 0) {
      // Sort by valid_from descending to get the most recent
      validNames.sort((a, b) => {
        const dateA = a.valid_from ? new Date(a.valid_from).getTime() : 0;
        const dateB = b.valid_from ? new Date(b.valid_from).getTime() : 0;
        return dateB - dateA;
      });
      return validNames[0].name;
    }
    
    return stadium.name;
  };

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      setLoading(true);
      try {
        // Load all dropdown data via API calls
        const [matchesRes, teamsRes, competitionsRes, seasonsRes, playersRes, stadiumsRes, stadiumNamesRes] = await Promise.all([
          callAdminApi('matches', 'GET'),
          callAdminApi('teams', 'GET'),
          callAdminApi('competitions', 'GET'),
          callAdminApi('seasons', 'GET'),
          callAdminApi('players', 'GET'),
          callAdminApi('stadia', 'GET'),
          callAdminApi('stadium-names', 'GET'),
        ]);

        if (teamsRes.data) setTeams(teamsRes.data);
        if (competitionsRes.data) setCompetitions(competitionsRes.data);
        if (seasonsRes.data) setSeasons(seasonsRes.data);
        if (matchesRes.data) setMatches(matchesRes.data);
        if (stadiumsRes.data) {
          setStadiums(stadiumsRes.data);
        } else {
          console.warn('No stadiums data');
        }
        if (stadiumNamesRes.data) setStadiumNames(stadiumNamesRes.data);
        if (playersRes.data) setPlayers(playersRes.data);
      } catch (error) {
        showMessage('Error loading data', 'error');
        console.error('Error loading dropdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDropdownData();
    fetchRecentRecords();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Functions to fetch recent records for each entity type
  const fetchRecentRecords = useCallback(async (page: number = 1) => {
    try {
      console.log(`Fetching recent records for page ${page}...`);
      const offset = (page - 1) * recordsPerPage;
      
      // Determine which table to fetch based on active tab
      let tableName = '';
      
      switch (activeTab) {
        case 'media':
          tableName = 'media';
          break;
        case 'teams':
          tableName = 'teams';
          break;
        case 'players':
          tableName = 'players';
          break;
        case 'player_stats':
          tableName = 'player_stats';
          break;
        case 'player_history':
          tableName = 'player_history';
          break;
        case 'stadiums':
          tableName = 'stadiums';
          break;
        case 'stadium_names':
          tableName = 'stadium_names';
          break;
        case 'stadiums':
          tableName = 'stadia';
          break;
        case 'matches':
        default:
          // Matches are already loaded separately
          return;
      }

      if (tableName) {
        // Fetch data via API
        const apiEndpoint = tableName === 'stadia' ? 'stadia' : tableName;
        const dataRes = await callAdminApi(apiEndpoint, 'GET');
        
        // Apply pagination client-side
        const paginatedData = dataRes.data ? dataRes.data.slice(offset, offset + recordsPerPage) : [];
        const totalCount = dataRes.data ? dataRes.data.length : 0;

        console.log(`${tableName} response:`, dataRes);
        console.log(`${tableName} data:`, paginatedData);
        console.log(`${tableName} count:`, totalCount);
        
        // Set the appropriate state based on the active tab
        if (paginatedData) {
          console.log(`Setting recent ${tableName}:`, paginatedData);
          switch (activeTab) {
            case 'media':
              setRecentMedia(paginatedData as Media[]);
              break;
            case 'teams':
              setRecentTeams(paginatedData as Team[]);
              break;
            case 'players':
              setRecentPlayers(paginatedData as Player[]);
              break;
            case 'player_stats':
              setRecentPlayerStats(paginatedData as PlayerStats[]);
              break;
            case 'player_history':
              setRecentPlayerHistory(paginatedData as PlayerHistory[]);
              break;
            case 'stadiums':
              setRecentStadiums(paginatedData as Stadium[]);
              break;
            case 'stadium_names':
              setRecentStadiumNames(paginatedData as StadiumName[]);
              break;
          }
        } else {
          console.log(`No ${tableName} data found`);
          switch (activeTab) {
            case 'media':
              setRecentMedia([]);
              break;
            case 'teams':
              setRecentTeams([]);
              break;
            case 'players':
              setRecentPlayers([]);
              break;
            case 'player_stats':
              setRecentPlayerStats([]);
              break;
            case 'player_history':
              setRecentPlayerHistory([]);
              break;
            case 'stadiums':
              setRecentStadiums([]);
              break;
            case 'stadium_names':
              setRecentStadiumNames([]);
              break;
          }
        }
        
        if (totalCount !== null) {
          setTotalCount(totalCount);
          setTotalPages(Math.ceil(totalCount / recordsPerPage));
        }
      }
    } catch (error) {
      console.error('Error fetching recent records:', error);
    }
  }, [activeTab, recordsPerPage, setRecentMedia, setRecentTeams, setRecentPlayers, setRecentPlayerStats, setRecentPlayerHistory, setRecentStadiums, setRecentStadiumNames, setTotalCount, setTotalPages]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setMatchesCurrentPage(1);
    setMatchesTotalPages(1);
    fetchRecentRecords(1);
  }, [activeTab]);

  // Pagination controls
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchRecentRecords(page);
    }
  };

  // Helper function for filtering matches (searches across ALL matches)
  const getFilteredMatches = useCallback(() => {
    return matches.filter(match => {
      if (!matchSearch) return true;
      const searchTerm = matchSearch.toLowerCase();
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
        match.venue?.toLowerCase().includes(searchTerm)
      );
    });
  }, [matches, teams, matchSearch]);

  // Get paginated matches (applies pagination to filtered results)
  const getPaginatedMatches = () => {
    const filtered = getFilteredMatches();
    const startIndex = (matchesCurrentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Update matches pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredMatches();
    const newTotalPages = Math.ceil(filtered.length / matchesPerPage);
    setMatchesTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (matchesCurrentPage > newTotalPages && newTotalPages > 0) {
      setMatchesCurrentPage(1);
    }
  }, [getFilteredMatches, matchesCurrentPage, matchesPerPage]);

  const handleDeleteMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await callAdminApi('matches', 'DELETE', { id: matchId });
      showMessage('Match deleted successfully', 'success');

      // Reload matches data
      try {
        const matchesResponse = await callAdminApi('matches', 'GET');
        if (matchesResponse.data) setMatches(matchesResponse.data);
      } catch (error) {
        console.error('Error reloading matches:', error);
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      showMessage('Error deleting match', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMatch = (match: Match) => {
    setIsEditMode(true);
    setEditingMatchId(match.id);
    
    // Try to match the venue by comparing current stadium names with stadium_display_name
    const matchedStadium = stadiums.find(s => {
      const currentName = getCurrentStadiumName(s.id, match.date);
      const displayNameLower = match.stadium_display_name?.toLowerCase() || '';
      const currentNameLower = currentName.toLowerCase();
      const venueLower = match.venue?.toLowerCase() || '';
      
      return (
        currentName === match.stadium_display_name ||
        currentNameLower === displayNameLower ||
        s.name === match.venue ||
        venueLower === currentNameLower ||
        displayNameLower.includes(currentNameLower) ||
        currentNameLower.includes(displayNameLower)
      );
    });
    
    // Use the current stadium name for the form value
    const venueValue = matchedStadium ? getCurrentStadiumName(matchedStadium.id, match.date) : match.stadium_display_name || match.venue;
    
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
      venue: venueValue,
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
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingMatchId(null);
    setShowExtraTimeSection(false);
    setShowStatsSection(false);
    setMatchForm({
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
      venue: '',
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
    });
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Auto-set home/away teams based on is_home_match
      const spursTeam = teams.find(t => t.is_tottenham);
      if (!spursTeam) {
        showMessage('Tottenham team not found', 'error');
        return;
      }

      // Validate required fields
      if (!matchForm.season_id || !matchForm.competition_id || !matchForm.date || !matchForm.away_team_id) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      const payload = {
        season_id: matchForm.season_id,
        competition_id: matchForm.competition_id,
        date: matchForm.date,
        kickoff_time: matchForm.kickoff_time || null,
        is_home_match: matchForm.is_home_match,
        spurs_score: matchForm.spurs_score || 0,
        opponent_score: matchForm.opponent_score || 0,
        spurs_score_aet: matchForm.spurs_score_aet !== null && matchForm.spurs_score_aet !== undefined ? matchForm.spurs_score_aet : null,
        opponent_score_aet: matchForm.opponent_score_aet !== null && matchForm.opponent_score_aet !== undefined ? matchForm.opponent_score_aet : null,
        spurs_score_pens: matchForm.spurs_score_pens !== null && matchForm.spurs_score_pens !== undefined ? matchForm.spurs_score_pens : null,
        opponent_score_pens: matchForm.opponent_score_pens !== null && matchForm.opponent_score_pens !== undefined ? matchForm.opponent_score_pens : null,
        venue: matchForm.venue || '',
        attended: matchForm.attended || false,
        notes: matchForm.notes || '',
        home_team_id: matchForm.is_home_match ? spursTeam.id : (matchForm.home_team_id || matchForm.away_team_id),
        away_team_id: matchForm.is_home_match ? (matchForm.away_team_id || matchForm.home_team_id) : spursTeam.id,
        attendance: matchForm.attendance !== null && matchForm.attendance !== undefined ? matchForm.attendance : null,
        home_possession: matchForm.home_possession !== null && matchForm.home_possession !== undefined ? matchForm.home_possession : null,
        away_possession: matchForm.away_possession !== null && matchForm.away_possession !== undefined ? matchForm.away_possession : null,
        home_total_shots: matchForm.home_total_shots !== null && matchForm.home_total_shots !== undefined ? matchForm.home_total_shots : null,
        away_total_shots: matchForm.away_total_shots !== null && matchForm.away_total_shots !== undefined ? matchForm.away_total_shots : null,
        home_shots_on_target: matchForm.home_shots_on_target !== null && matchForm.home_shots_on_target !== undefined ? matchForm.home_shots_on_target : null,
        away_shots_on_target: matchForm.away_shots_on_target !== null && matchForm.away_shots_on_target !== undefined ? matchForm.away_shots_on_target : null,
        home_corners: matchForm.home_corners !== null && matchForm.home_corners !== undefined ? matchForm.home_corners : null,
        away_corners: matchForm.away_corners !== null && matchForm.away_corners !== undefined ? matchForm.away_corners : null,
      };

      let response;
      if (isEditMode && editingMatchId) {
        // Update existing match
        response = await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingMatchId, ...payload }),
        });
      } else {
        // Create new match
        response = await fetch('/api/admin/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} match`);
      }

      showMessage(isEditMode ? 'Match updated successfully' : 'Match created successfully', 'success');
      
      // Reset form and edit mode
      handleCancelEdit();
      
      // Reload matches data
      try {
        const matchesResponse = await fetch('/api/admin/matches');
        const matchesResult = await matchesResponse.json();
        if (matchesResult.data) setMatches(matchesResult.data);
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
  };

  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create media');
      }

      showMessage('Media created successfully', 'success');
      setMediaForm({
        match_id: '',
        type: 'social media',
        title: '',
        url: '',
        caption: '',
        sort_order: 0,
      });
      
      // Reload recent media records
      try {
        const mediaResponse = await fetch('/api/admin/media');
        const mediaResult = await mediaResponse.json();
        if (mediaResult.data) {
          setRecentMedia(mediaResult.data);
        }
      } catch (error) {
        console.error('Error reloading recent media:', error);
      }
    } catch (error) {
      console.error('Error creating media:', error);
      
      let errorMessage = 'Error creating media';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `Error creating media: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `Error creating media: ${error.code}`;
        } else {
          errorMessage = `Error creating media: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `Error creating media: ${error}`;
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="spurs-wrapper min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="spurs-text text-3xl font-bold">Supabase Admin Interface</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">{user.email}</span>
              <Button
                variant="spurs"
                size="sm"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-4 rounded ${
            message.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-600 mb-8 gap-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'matches'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'matches' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'matches' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'matches' ? '2px' : '0',
              color: activeTab === 'matches' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Match
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'media'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'media' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'media' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'media' ? '2px' : '0',
              color: activeTab === 'media' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Media
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'teams'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'teams' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'teams' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'teams' ? '2px' : '0',
              color: activeTab === 'teams' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Team
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'players'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'players' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'players' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'players' ? '2px' : '0',
              color: activeTab === 'players' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Player
          </button>
          <button
            onClick={() => setActiveTab('player_stats')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'player_stats'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'player_stats' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'player_stats' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'player_stats' ? '2px' : '0',
              color: activeTab === 'player_stats' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Player Stats
          </button>
          <button
            onClick={() => setActiveTab('player_history')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'player_history'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'player_history' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'player_history' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'player_history' ? '2px' : '0',
              color: activeTab === 'player_history' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Player History
          </button>
          <button
            onClick={() => setActiveTab('stadiums')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'stadiums'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'stadiums' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'stadiums' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'stadiums' ? '2px' : '0',
              color: activeTab === 'stadiums' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Stadium
          </button>
          <button
            onClick={() => setActiveTab('stadium_names')}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              activeTab === 'stadium_names'
                ? 'spurs-text'
                : 'text-gray-300 hover:text-spurs-dark-accent'
            }`}
            style={{
              backgroundColor: activeTab === 'stadium_names' ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
              borderBottomColor: activeTab === 'stadium_names' ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: activeTab === 'stadium_names' ? '2px' : '0',
              color: activeTab === 'stadium_names' ? 'var(--spurs-dark-accent)' : '#d1d5db'
            }}
          >
            Add Stadium Name
          </button>
        </div>

        {/* Match Form */}
        {activeTab === 'matches' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold spurs-text">
                {isEditMode ? 'Edit Match' : 'Add New Match'}
              </h2>
              {isEditMode && (
                <div className="flex gap-2">
                  <Button
                    variant="spurs"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this match?')) {
                        handleDeleteMatch(editingMatchId!);
                      }
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="spurs"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            <form onSubmit={handleMatchSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Season Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Season</label>
                  <select
                    value={matchForm.season_id || ''}
                    onChange={(e) => setMatchForm({ ...matchForm, season_id: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="">Select season</option>
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Competition Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Competition</label>
                  <select
                    value={matchForm.competition_id || ''}
                    onChange={(e) => setMatchForm({ ...matchForm, competition_id: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="">Select competition</option>
                    {competitions.map(competition => (
                      <option key={competition.id} value={competition.id}>
                        {competition.name} ({competition.nickname})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={matchForm.date || ''}
                    onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  />
                </div>

                {/* Kickoff Time */}
                <div>
                  <label className="block text-sm font-medium mb-2">Kickoff Time</label>
                  <input
                    type="time"
                    value={matchForm.kickoff_time || ''}
                    onChange={(e) => setMatchForm({ ...matchForm, kickoff_time: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>

                {/* Home/Away Toggle */}
                <div>
                  <label className="block text-sm font-medium mb-2">Match Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={matchForm.is_home_match === true}
                        onChange={() => setMatchForm({ ...matchForm, is_home_match: true })}
                        className="mr-2"
                      />
                      Home Match
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={matchForm.is_home_match === false}
                        onChange={() => setMatchForm({ ...matchForm, is_home_match: false })}
                        className="mr-2"
                      />
                      Away Match
                    </label>
                  </div>
                </div>

                {/* Opponent Team Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opponent {matchForm.is_home_match ? 'Away' : 'Home'} Team
                  </label>
                  <select
                    value={matchForm.is_home_match ? (matchForm.away_team_id?.toString() || '') : (matchForm.home_team_id?.toString() || '')}
                    onChange={(e) => setMatchForm({ ...matchForm, [matchForm.is_home_match ? 'away_team_id' : 'home_team_id']: parseInt(e.target.value) })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="">Select opponent</option>
                    {teams.filter(team => !team.is_tottenham).map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium mb-2">Venue (Stadium)</label>
                  <select
                    value={matchForm.venue || ''}
                    onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="">Select stadium</option>
                    {stadiums.map(stadium => {
                      const currentName = getCurrentStadiumName(stadium.id, matchForm.date || new Date().toISOString().split('T')[0]);
                      return (
                        <option key={stadium.id} value={currentName}>
                          {currentName} {stadium.city && currentName !== stadium.name ? `(${stadium.city})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Spurs Score</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.spurs_score ?? ''}
                      onChange={(e) => setMatchForm({ ...matchForm, spurs_score: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Opponent Score</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.opponent_score ?? ''}
                      onChange={(e) => setMatchForm({ ...matchForm, opponent_score: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    />
                  </div>
                </div>

                {/* Attended */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={matchForm.attended === true}
                      onChange={(e) => setMatchForm({ ...matchForm, attended: e.target.checked })}
                      className="mr-2"
                    />
                    I attended this match
                  </label>
                </div>

                {/* Attendance */}
                <div>
                  <label className="block text-sm font-medium mb-2">Attendance</label>
                  <input
                    type="number"
                    min="0"
                    value={matchForm.attendance === null || matchForm.attendance === undefined ? '' : matchForm.attendance}
                    onChange={(e) => setMatchForm({ ...matchForm, attendance: e.target.value !== '' ? parseInt(e.target.value) : null })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 spurs-text">Notes</label>
                <textarea
                  value={matchForm.notes || ''}
                  onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  rows={4}
                  placeholder="Match notes, highlights, etc."
                />
              </div>

              {/* Stats Collapsible Section */}
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStatsSection(!showStatsSection)}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: showStatsSection ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
                    borderColor: showStatsSection ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderWidth: showStatsSection ? '2px' : '0',
                  }}
                >
                  <span className="font-medium text-white">Match Stats</span>
                  <span className="text-gray-400 transform transition-transform">
                    {showStatsSection ? '▼' : '▶'}
                  </span>
                </button>
                
                {showStatsSection && (
                  <div className="p-4 space-y-4 bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Possession */}
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Home Possession (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={matchForm.home_possession === null || matchForm.home_possession === undefined ? '' : matchForm.home_possession}
                          onChange={(e) => setMatchForm({ ...matchForm, home_possession: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Away Possession (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={matchForm.away_possession === null || matchForm.away_possession === undefined ? '' : matchForm.away_possession}
                          onChange={(e) => setMatchForm({ ...matchForm, away_possession: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>

                      {/* Total Shots */}
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Home Total Shots</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.home_total_shots === null || matchForm.home_total_shots === undefined ? '' : matchForm.home_total_shots}
                          onChange={(e) => setMatchForm({ ...matchForm, home_total_shots: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Away Total Shots</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.away_total_shots === null || matchForm.away_total_shots === undefined ? '' : matchForm.away_total_shots}
                          onChange={(e) => setMatchForm({ ...matchForm, away_total_shots: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>

                      {/* Shots On Target */}
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Home Shots On Target</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.home_shots_on_target === null || matchForm.home_shots_on_target === undefined ? '' : matchForm.home_shots_on_target}
                          onChange={(e) => setMatchForm({ ...matchForm, home_shots_on_target: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Away Shots On Target</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.away_shots_on_target === null || matchForm.away_shots_on_target === undefined ? '' : matchForm.away_shots_on_target}
                          onChange={(e) => setMatchForm({ ...matchForm, away_shots_on_target: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>

                      {/* Corners */}
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Home Corners</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.home_corners === null || matchForm.home_corners === undefined ? '' : matchForm.home_corners}
                          onChange={(e) => setMatchForm({ ...matchForm, home_corners: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Away Corners</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.away_corners === null || matchForm.away_corners === undefined ? '' : matchForm.away_corners}
                          onChange={(e) => setMatchForm({ ...matchForm, away_corners: e.target.value !== '' ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Extra Time & Penalties Collapsible Section */}
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowExtraTimeSection(!showExtraTimeSection)}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: showExtraTimeSection ? 'var(--spurs-dark-bg-1)' : 'rgba(8, 21, 33, 0.3)',
                    borderColor: showExtraTimeSection ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderWidth: showExtraTimeSection ? '2px' : '0',
                  }}
                >
                  <span className="font-medium text-white">Extra Time</span>
                  <span className="text-gray-400 transform transition-transform">
                    {showExtraTimeSection ? '▼' : '▶'}
                  </span>
                </button>
                
                {showExtraTimeSection && (
                  <div className="p-4 space-y-4 bg-gray-800/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Spurs Score (AET)</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.spurs_score_aet ?? ''}
                          onChange={(e) => setMatchForm({ ...matchForm, spurs_score_aet: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                          placeholder="After extra time"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Opponent Score (AET)</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.opponent_score_aet ?? ''}
                          onChange={(e) => setMatchForm({ ...matchForm, opponent_score_aet: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                          placeholder="After extra time"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Spurs Score (Penalties)</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.spurs_score_pens ?? ''}
                          onChange={(e) => setMatchForm({ ...matchForm, spurs_score_pens: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                          placeholder="Penalty shootout"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 spurs-text">Opponent Score (Penalties)</label>
                        <input
                          type="number"
                          min="0"
                          value={matchForm.opponent_score_pens ?? ''}
                          onChange={(e) => setMatchForm({ ...matchForm, opponent_score_pens: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                          placeholder="Penalty shootout"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="spurs"
                disabled={loading}
                loading={loading}
                fullWidth
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Match' : 'Create Match')}
              </Button>
            </form>
          </div>
        )}

        {/* Media Form */}
        {activeTab === 'media' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Add New Media</h2>
            
            <form onSubmit={handleMediaSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Season Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Season</label>
                  <select
                    value={mediaSeason}
                    onChange={(e) => setMediaSeason(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">All seasons</option>
                    {(() => {
                      const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                      return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                
                {/* Match Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Match</label>
                  <select
                    value={mediaForm.match_id || ''}
                    onChange={(e) => setMediaForm({ ...mediaForm, match_id: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="">Select match</option>
                    {matches.filter(match => !mediaSeason || match.season_id === mediaSeason).map(match => {
                      const homeTeam = teams.find(t => t.id === match.home_team_id);
                      const awayTeam = teams.find(t => t.id === match.away_team_id);
                      const competition = competitions.find(c => c.id === match.competition_id);
                      
                      return (
                        <option key={match.id} value={match.id}>
                          {homeTeam?.short_name} vs {awayTeam?.short_name} - {competition?.nickname} ({match.date})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Media Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Media Type</label>
                  <select
                    value={mediaForm.type || 'social media'}
                    onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value as Media['type'] })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    required
                  >
                    <option value="social media">Social Media</option>
                    <option value="article">Article</option>
                    <option value="photo">Photo</option>
                    <option value="photo album">Photo Album</option>
                    <option value="video-external">External Video</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={mediaForm.title || ''}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Media title (optional)"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium mb-2">URL</label>
                  <input
                    type="url"
                    value={mediaForm.url || ''}
                    onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="https://..."
                    required
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={mediaForm.sort_order || 0}
                    onChange={(e) => setMediaForm({ ...mediaForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium mb-2">Caption</label>
                <textarea
                  value={mediaForm.caption || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  rows={3}
                  placeholder="Media caption or description"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Media'}
              </button>
            </form>
          </div>
        )}

        {/* Team Form */}
        {activeTab === 'teams' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Team</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  name: formData.get('name') as string,
                  short_name: formData.get('short_name') as string,
                  primary_color: formData.get('primary_color') as string || null,
                  secondary_color: formData.get('secondary_color') as string || null,
                  is_tottenham: formData.get('is_tottenham') === 'true',
                };

                await createEntityAndReload('teams', payload, 'teams', setTeams);
                
                // Reload recent teams records
                try {
                  const teamsRes = await callAdminApi('teams', 'GET');
                  if (teamsRes.data) setRecentTeams(teamsRes.data.slice(0, 10));
                } catch (error) {
                  console.error('Error reloading recent teams:', error);
                }
                
                if (e.currentTarget && 'reset' in e.currentTarget) {
                  e.currentTarget.reset();
                }
              } catch (error) {
                showMessage('Error creating team', 'error');
                console.error('Error creating team:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Team Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Team name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Short Name</label>
                  <input
                    name="short_name"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Short name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <input
                    name="primary_color"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="e.g., blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Color</label>
                  <input
                    name="secondary_color"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="e.g., white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Is Tottenham?</label>
                  <select
                    name="is_tottenham"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>
        )}

        {/* Player Form */}
        {activeTab === 'players' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Player</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  first_name: formData.get('first_name') as string || null,
                  last_name: formData.get('last_name') as string,
                  date_of_birth: formData.get('date_of_birth') as string || null,
                  nationality: formData.get('nationality') as string || null,
                  position: formData.get('position') as string || null,
                  height_cm: formData.get('height_cm') ? parseInt(formData.get('height_cm') as string) : null,
                  weight_kg: formData.get('weight_kg') ? parseInt(formData.get('weight_kg') as string) : null,
                  profile_image_url: formData.get('profile_image_url') as string || null,
                  is_active: formData.get('is_active') === 'true',
                };

                await createEntityAndReload('players', payload, 'players', setPlayers);
                
                // Reload recent players records
                try {
                  const playersRes = await callAdminApi('players', 'GET');
                  if (playersRes.data) setRecentPlayers(playersRes.data.slice(0, 10));
                } catch (error) {
                  console.error('Error reloading recent players:', error);
                }
                
                if (e.currentTarget && 'reset' in e.currentTarget) {
                  e.currentTarget.reset();
                }
              } catch (error) {
                showMessage('Error creating player', 'error');
                console.error('Error creating player:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    name="first_name"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    name="date_of_birth"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nationality</label>
                  <input
                    name="nationality"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Nationality"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <select
                    name="position"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select position</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="Defender">Defender</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Forward">Forward</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (cm)</label>
                  <input
                    name="height_cm"
                    type="number"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Height in cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <input
                    name="weight_kg"
                    type="number"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Image URL</label>
                  <input
                    name="profile_image_url"
                    type="url"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Is Active?</label>
                  <select
                    name="is_active"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Player'}
              </button>
            </form>
          </div>
        )}

        {/* Stadium Form */}
        {activeTab === 'stadiums' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Stadium</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  name: formData.get('name') as string,
                  slug: formData.get('slug') as string,
                  city: formData.get('city') as string || null,
                  country: formData.get('country') as string || null,
                  capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null,
                  opened_date: formData.get('opened_date') as string || null,
                  address_line_1: formData.get('address_line_1') as string || null,
                  postcode: formData.get('postcode') as string || null,
                  latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
                  longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
                  home_team_id: formData.get('home_team_id') ? parseInt(formData.get('home_team_id') as string) : null,
                };

                await createEntityAndReload('stadia', payload, 'stadia', setStadiums);
                
                // Reload recent stadiums records
                try {
                  const stadiumsRes = await callAdminApi('stadia', 'GET');
                  if (stadiumsRes.data) setRecentStadiums(stadiumsRes.data.slice(0, 10));
                } catch (error) {
                  console.error('Error reloading recent stadiums:', error);
                }
                
                if (e.currentTarget && 'reset' in e.currentTarget) {
                  e.currentTarget.reset();
                }
              } catch (error) {
                showMessage('Error creating stadium', 'error');
                console.error('Error creating stadium:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Stadium Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Stadium name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <input
                    name="slug"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="stadium-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    name="city"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    name="country"
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity</label>
                  <input
                    name="capacity"
                    type="number"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Capacity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Opened Date</label>
                  <input
                    name="opened_date"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address Line 1</label>
                  <input
                    name="address_line_1"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Home Team</label>
                  <select
                    name="home_team_id"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select team (optional)</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Longitude"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Stadium'}
              </button>
            </form>
          </div>
        )}

        {/* Player Stats Form */}
        {activeTab === 'player_stats' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Player Stats</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  player_id: formData.get('player_id') as string,
                  match_id: formData.get('match_id') as string,
                  team_id: parseInt(formData.get('team_id') as string),
                  started: formData.get('started') === 'true',
                  was_substitute: formData.get('was_substitute') === 'true',
                  was_unused_substitute: formData.get('was_unused_substitute') === 'true',
                  minute_on: formData.get('minute_on') ? parseInt(formData.get('minute_on') as string) : null,
                  minute_off: formData.get('minute_off') ? parseInt(formData.get('minute_off') as string) : null,
                  minutes_played: parseInt(formData.get('minutes_played') as string),
                  goals: parseInt(formData.get('goals') as string),
                  assists: parseInt(formData.get('assists') as string),
                  yellow_cards: parseInt(formData.get('yellow_cards') as string),
                  red_cards: parseInt(formData.get('red_cards') as string),
                  clean_sheet: formData.get('clean_sheet') === 'true' ? true : null,
                  saves: formData.get('saves') ? parseInt(formData.get('saves') as string) : null,
                  shots: parseInt(formData.get('shots') as string),
                  shots_on_target: parseInt(formData.get('shots_on_target') as string),
                  passes_completed: formData.get('passes_completed') ? parseInt(formData.get('passes_completed') as string) : null,
                  passes_attempted: formData.get('passes_attempted') ? parseInt(formData.get('passes_attempted') as string) : null,
                  tackles: formData.get('tackles') ? parseInt(formData.get('tackles') as string) : null,
                  interceptions: formData.get('interceptions') ? parseInt(formData.get('interceptions') as string) : null,
                  clearances: formData.get('clearances') ? parseInt(formData.get('clearances') as string) : null,
                  fouls_committed: formData.get('fouls_committed') ? parseInt(formData.get('fouls_committed') as string) : null,
                  fouls_won: formData.get('fouls_won') ? parseInt(formData.get('fouls_won') as string) : null,
                  offsides: formData.get('offsides') ? parseInt(formData.get('offsides') as string) : null,
                  player_rating: formData.get('player_rating') ? parseFloat(formData.get('player_rating') as string) : null,
                  player_of_the_match: formData.get('player_of_the_match') === 'true',
                };

                await createEntityAndReload('player-stats', payload, 'player-stats', () => {
                // Player stats don't need to reload a list, just show success
              });
              
              // Reload recent player stats records
              try {
                const playerStatsRes = await callAdminApi('player-stats', 'GET');
                if (playerStatsRes.data) setRecentPlayerStats(playerStatsRes.data.slice(0, 10));
              } catch (error) {
                console.error('Error reloading recent player stats:', error);
              }
              
              if (e.currentTarget && 'reset' in e.currentTarget) {
                e.currentTarget.reset();
              }
              } catch (error) {
                showMessage('Error creating player stats', 'error');
                console.error('Error creating player stats:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Season</label>
                  <select
                    value={playerStatsSeason}
                    onChange={(e) => setPlayerStatsSeason(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">All seasons</option>
                    {(() => {
                      const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                      return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Player *</label>
                  <select
                    name="player_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select player</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.first_name} {player.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Match *</label>
                  <select
                    name="match_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select match</option>
                    {matches.filter(match => !playerStatsSeason || match.season_id === playerStatsSeason).map(match => {
                      const homeTeam = teams.find(t => t.id === match.home_team_id);
                      const awayTeam = teams.find(t => t.id === match.away_team_id);
                      return (
                        <option key={match.id} value={match.id}>
                          {homeTeam?.short_name} vs {awayTeam?.short_name} ({match.date})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Team *</label>
                  <select
                    name="team_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select team</option>
                    {teams.map(team => (
                      <option 
                        key={team.id} 
                        value={team.id}
                                              >
                        {team.name} {team.is_tottenham && '(Default)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Started?</label>
                  <select
                    name="started"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Was Substitute?</label>
                  <select
                    name="was_substitute"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Was Unused Substitute?</label>
                  <select
                    name="was_unused_substitute"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minute On</label>
                  <input
                    name="minute_on"
                    type="number"
                    min="0"
                    max="120"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Minute entered"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minute Off</label>
                  <input
                    name="minute_off"
                    type="number"
                    min="0"
                    max="120"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Minute subbed off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Goals</label>
                  <input
                    name="goals"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Goals scored"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assists</label>
                  <input
                    name="assists"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Assists"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Yellow Cards</label>
                  <input
                    name="yellow_cards"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Yellow cards"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Red Cards</label>
                  <input
                    name="red_cards"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Red cards"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Clean Sheet</label>
                  <select
                    name="clean_sheet"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">N/A</option>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Player of the Match?</label>
                  <select
                    name="player_of_the_match"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Player Stats'}
              </button>
            </form>
          </div>
        )}

        {/* Player History Form */}
        {activeTab === 'player_history' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Player History</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  player_id: formData.get('player_id') as string,
                  team_id: parseInt(formData.get('team_id') as string),
                  joined_on: formData.get('joined_on') as string || null,
                  left_on: formData.get('left_on') as string || null,
                };

                await createEntityAndReload('player-history', payload, 'player-history', () => {
                // Player history doesn't need to reload a list, just show success
              });
              
              // Reload recent player history records
              try {
                const playerHistoryRes = await callAdminApi('player-history', 'GET');
                if (playerHistoryRes.data) setRecentPlayerHistory(playerHistoryRes.data.slice(0, 10));
              } catch (error) {
                console.error('Error reloading recent player history:', error);
              }
              
              if (e.currentTarget && 'reset' in e.currentTarget) {
                e.currentTarget.reset();
              }
              } catch (error) {
                showMessage('Error creating player history', 'error');
                console.error('Error creating player history:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Player *</label>
                  <select
                    name="player_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select player</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.first_name} {player.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Team *</label>
                  <select
                    name="team_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select team</option>
                    {teams.map(team => (
                      <option 
                        key={team.id} 
                        value={team.id}
                                              >
                        {team.name} {team.is_tottenham && '(Default)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Joined On</label>
                  <input
                    name="joined_on"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Left On</label>
                  <input
                    name="left_on"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Squad Number</label>
                  <input
                    name="squad_number"
                    type="number"
                    min="1"
                    max="99"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Squad number"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Player History'}
              </button>
            </form>
          </div>
        )}

        {/* Stadium Names Form */}
        {activeTab === 'stadium_names' && (
          <div className="spurs-accent-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 spurs-text">Add New Stadium Name</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const payload = {
                  stadium_id: formData.get('stadium_id') as string,
                  name: formData.get('name') as string,
                  valid_from: formData.get('valid_from') as string || null,
                  valid_to: formData.get('valid_to') as string || null,
                };

                await createEntityAndReload('stadium-names', payload, 'stadium-names', () => {
                // Stadium names don't need to reload a list, just show success
              });
                if (e.currentTarget && 'reset' in e.currentTarget) {
                  e.currentTarget.reset();
                }
              } catch (error) {
                showMessage('Error creating stadium name', 'error');
                console.error('Error creating stadium name:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Stadium *</label>
                  <select
                    name="stadium_id"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                  >
                    <option value="">Select stadium</option>
                    {stadiums.map(stadium => (
                      <option key={stadium.id} value={stadium.id}>
                        {stadium.name} {stadium.city && `(${stadium.city})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stadium Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Historical or alternative stadium name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid From</label>
                  <input
                    name="valid_from"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Date this name became valid"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid To</label>
                  <input
                    name="valid_to"
                    type="date"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
                    placeholder="Date this name was no longer valid"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-4">
                <p>Use this form to add historical stadium names or naming variations. For example:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Previous names (e.g., &ldquo;White Hart Lane&rdquo;)</li>
                  <li>Sponsored names (e.g., &ldquo;Tottenham Hotspur Stadium&rdquo;)</li>
                  <li>Historical variations</li>
                </ul>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="spurs-button w-full md:w-auto px-6 py-2 rounded font-medium"
              >
                {loading ? 'Creating...' : 'Create Stadium Name'}
              </button>
            </form>
          </div>
        )}

        {/* Recent Records Preview */}
        <div className="mt-8 spurs-accent-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold spurs-text">
              {activeTab === 'matches' 
                ? (matchSearch ? `All Matches (${getFilteredMatches().length} filtered)` : 'All Matches')
                : activeTab === 'media' ? 'Recent Media' :
                activeTab === 'teams' ? 'Recent Teams' :
                activeTab === 'players' ? 'Recent Players' :
                activeTab === 'player_stats' ? 'Recent Player Stats' :
                activeTab === 'player_history' ? 'Recent Player History' :
                activeTab === 'stadiums' ? 'Recent Stadiums' :
                activeTab === 'stadium_names' ? 'Recent Stadium Names' : 'Recent Records'}
            </h3>
          </div>
          {activeTab === 'matches' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search matches by date, opponent, or venue..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  {activeTab === 'matches' && (
                    <>
                      <th className="text-left p-2 spurs-text">Date</th>
                      <th className="text-left p-2 spurs-text">Teams</th>
                      <th className="text-left p-2 spurs-text">Competition</th>
                      <th className="text-left p-2 spurs-text">Score</th>
                      <th className="text-left p-2 spurs-text">Venue</th>
                    </>
                  )}
                  {activeTab === 'media' && (
                    <>
                      <th className="text-left p-2 spurs-text">Type</th>
                      <th className="text-left p-2 spurs-text">Match</th>
                      <th className="text-left p-2 spurs-text">URL</th>
                    </>
                  )}
                  {activeTab === 'teams' && (
                    <>
                      <th className="text-left p-2 spurs-text">Name</th>
                      <th className="text-left p-2 spurs-text">Short Name</th>
                      <th className="text-left p-2 spurs-text">Primary Color</th>
                      <th className="text-left p-2 spurs-text">Secondary Color</th>
                    </>
                  )}
                  {activeTab === 'players' && (
                    <>
                      <th className="text-left p-2 spurs-text">Name</th>
                      <th className="text-left p-2 spurs-text">Position</th>
                      <th className="text-left p-2 spurs-text">Nationality</th>
                    </>
                  )}
                  {activeTab === 'player_stats' && (
                    <>
                      <th className="text-left p-2 spurs-text">Player</th>
                      <th className="text-left p-2 spurs-text">Match</th>
                      <th className="text-left p-2 spurs-text">Started</th>
                      <th className="text-left p-2 spurs-text">Captain</th>
                      <th className="text-left p-2 spurs-text">Player of Match</th>
                      <th className="text-left p-2 spurs-text">Goals</th>
                    </>
                  )}
                  {activeTab === 'player_history' && (
                    <>
                      <th className="text-left p-2 spurs-text">Player</th>
                      <th className="text-left p-2 spurs-text">Team</th>
                      <th className="text-left p-2 spurs-text">Squad Number</th>
                      <th className="text-left p-2 spurs-text">Joined</th>
                      <th className="text-left p-2 spurs-text">Left</th>
                    </>
                  )}
                  {activeTab === 'stadiums' && (
                    <>
                      <th className="text-left p-2 spurs-text">Name</th>
                      <th className="text-left p-2 spurs-text">City</th>
                      <th className="text-left p-2 spurs-text">Capacity</th>
                    </>
                  )}
                  {activeTab === 'stadium_names' && (
                    <>
                      <th className="text-left p-2 spurs-text">Stadium</th>
                      <th className="text-left p-2 spurs-text">Name</th>
                      <th className="text-left p-2 spurs-text">Valid From</th>
                      <th className="text-left p-2 spurs-text">Valid To</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'matches' && getPaginatedMatches().map(match => {
                  const homeTeam = teams.find(t => t.id === match.home_team_id);
                  const awayTeam = teams.find(t => t.id === match.away_team_id);
                  const competition = competitions.find(c => c.id === match.competition_id);
                  const displayVenue = match.stadium_display_name || match.venue;

                  return (
                    <tr 
                      key={match.id} 
                      className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleEditMatch(match)}
                    >
                      <td className="p-2 spurs-text">{match.date}</td>
                      <td className="p-2 spurs-text">{homeTeam?.short_name} vs {awayTeam?.short_name}</td>
                      <td className="p-2 spurs-text">{competition?.nickname}</td>
                      <td className="p-2 spurs-text">{match.spurs_score ?? '-'} - {match.opponent_score ?? '-'}</td>
                      <td className="p-2 spurs-text">{displayVenue}</td>
                    </tr>
                  );
                })}
                {activeTab === 'media' && (
                  <>
                    {console.log('Rendering media tab, recentMedia:', recentMedia)}
                    {console.log('recentMedia length:', recentMedia.length)}
                    {recentMedia.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-gray-400">
                          No media records found
                        </td>
                      </tr>
                    ) : (
                      recentMedia.map(media => {
                        const match = matches.find(m => m.id === media.match_id);
                        const homeTeam = teams.find(t => t.id === match?.home_team_id);
                        const awayTeam = teams.find(t => t.id === match?.away_team_id);

                        return (
                          <tr key={media.id} className="border-b border-gray-600">
                            <td className="p-2 spurs-text">{media.type}</td>
                            <td className="p-2 spurs-text">
                              {match && homeTeam && awayTeam
                                ? `${homeTeam.short_name} vs ${awayTeam.short_name} (${match.date})`
                                : '-'
                              }
                            </td>
                            <td className="p-2 spurs-text max-w-xs truncate">{media.url}</td>
                          </tr>
                        );
                      })
                    )}
                  </>
                )}
                {activeTab === 'teams' && (
                  <>
                    {recentTeams.map(team => {
                      return (
                        <tr key={team.id} className="border-b border-gray-600">
                          <td className="p-2 spurs-text">{team.name}</td>
                          <td className="p-2 spurs-text">{team.short_name}</td>
                          <td className="p-2 spurs-text">
                            <div className="flex items-center space-x-2">
                              {team.primary_color ? (
                                <div
                                  className="w-6 h-6 rounded border border-gray-400"
                                  style={{ backgroundColor: getTeamColor(team.primary_color) }}
                                  title={team.primary_color}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded border border-gray-400 bg-gray-600" title="No color" />
                              )}
                              <span className="text-xs">{team.primary_color || '-'}</span>
                            </div>
                          </td>
                          <td className="p-2 spurs-text">
                            <div className="flex items-center space-x-2">
                              {team.secondary_color ? (
                                <div
                                  className="w-6 h-6 rounded border border-gray-400"
                                  style={{ backgroundColor: getTeamColor(team.secondary_color) }}
                                  title={team.secondary_color}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded border border-gray-400 bg-gray-600" title="No color" />
                              )}
                              <span className="text-xs">{team.secondary_color || '-'}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
                {activeTab === 'players' && (
                  <>
                    {recentPlayers.map(player => {
                      return (
                        <tr key={player.id} className="border-b border-gray-600">
                          <td className="p-2 spurs-text">{player.first_name} {player.last_name}</td>
                          <td className="p-2 spurs-text">{player.position || '-'}</td>
                          <td className="p-2 spurs-text">{player.nationality || '-'}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
                {activeTab === 'player_stats' && (
                  <>
                    {recentPlayerStats.map(stat => {
                      const player = players.find(p => p.id === parseInt(stat.player_id));
                      const match = matches.find(m => m.id === stat.match_id);
                      const homeTeam = teams.find(t => t.id === match?.home_team_id);
                      const awayTeam = teams.find(t => t.id === match?.away_team_id);
                      return (
                        <tr key={stat.id} className="border-b border-gray-600">
                          <td className="p-2 spurs-text">{player?.first_name} {player?.last_name}</td>
                          <td className="p-2 spurs-text">
                            {match && homeTeam && awayTeam
                              ? `${homeTeam.short_name} vs ${awayTeam.short_name} (${match.date})`
                              : match?.date || '-'
                            }
                          </td>
                          <td className="p-2 spurs-text">{stat.started ? 'Yes' : 'No'}</td>
                          <td className="p-2 spurs-text">{stat.captain ? 'Yes' : 'No'}</td>
                          <td className="p-2 spurs-text">{stat.player_of_the_match ? 'Yes' : 'No'}</td>
                          <td className="p-2 spurs-text">{stat.goals}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
                {(() => {
                  console.log('=== PLAYER HISTORY DEBUG ===');
                  console.log('Total recentPlayerHistory records:', recentPlayerHistory.length);
                  console.log('Total players available:', players.length);
                  console.log('First 3 players:', players.slice(0, 3));
                  console.log('First player history record:', recentPlayerHistory[0]);
                  
                  return recentPlayerHistory.map(history => {
                    // Match by converting string IDs to numbers where needed
                    const player = players.find(p => p.id === parseInt(history.player_id));
                    const team = teams.find(t => t.id === history.team_id);
                    return (
                      <tr key={history.id} className="border-b border-gray-600">
                        <td className="p-2 spurs-text">
                          {player ? `${player.first_name} ${player.last_name}` : `Player ID: ${history.player_id} (not found)`}
                        </td>
                        <td className="p-2 spurs-text">{team?.name || 'Unknown Team'}</td>
                        <td className="p-2 spurs-text">{history.squad_number || '-'}</td>
                        <td className="p-2 spurs-text">{history.joined_on || '-'}</td>
                        <td className="p-2 spurs-text">{history.left_on || '-'}</td>
                      </tr>
                    );
                  });
                })()}
                {activeTab === 'stadiums' && recentStadiums
                  .sort((a, b) => {
                    // Sort by opened_date, fallback to name if no opened_date
                    if (!a.opened_date && !b.opened_date) return 0;
                    if (!a.opened_date) return 1;
                    if (!b.opened_date) return -1;
                    return new Date(b.opened_date).getTime() - new Date(a.opened_date).getTime();
                  })
                  .map(stadium => {
                    return (
                      <tr key={stadium.id} className="border-b border-gray-600">
                        <td className="p-2 spurs-text">{stadium.name}</td>
                        <td className="p-2 spurs-text">{stadium.city || '-'}</td>
                        <td className="p-2 spurs-text">{stadium.capacity || '-'}</td>
                      </tr>
                    );
                  })}
                {activeTab === 'stadium_names' && (
                  <>
                    {recentStadiumNames.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-gray-400">
                          No stadium names found
                        </td>
                      </tr>
                    ) : (
                      recentStadiumNames.map(stadiumName => {
                        const stadium = stadiums.find(s => s.id === stadiumName.stadium_id);
                        return (
                          <tr key={stadiumName.id} className="border-b border-gray-600">
                            <td className="p-2 spurs-text">{stadium?.name || 'Unknown Stadium'}</td>
                            <td className="p-2 spurs-text">{stadiumName.name}</td>
                            <td className="p-2 spurs-text">{stadiumName.valid_from || '-'}</td>
                            <td className="p-2 spurs-text">{stadiumName.valid_to || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {activeTab === 'matches' && matchesTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((matchesCurrentPage - 1) * matchesPerPage) + 1} to {Math.min(matchesCurrentPage * matchesPerPage, getFilteredMatches().length)} of {getFilteredMatches().length} matches
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMatchesCurrentPage(matchesCurrentPage - 1)}
                  disabled={matchesCurrentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {matchesCurrentPage} of {matchesTotalPages}
                </span>
                <button
                  onClick={() => setMatchesCurrentPage(matchesCurrentPage + 1)}
                  disabled={matchesCurrentPage === matchesTotalPages}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {activeTab !== 'matches' && activeTab !== 'stadium_names' && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalCount)} of {totalCount} records
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
