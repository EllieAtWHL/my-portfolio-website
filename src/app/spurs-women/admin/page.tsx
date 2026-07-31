'use client';

import { useState, useEffect, useCallback } from 'react';
import { callAdminApi, createEntityAndReload } from '@/lib/api-client';
import { buildMatchPayload } from '@/lib/admin-match-payload';
import { getTeamColor } from '@/lib/utils/team-colors';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { MatchForm } from '@/components/admin/MatchForm';
import { TeamForm } from '@/components/admin/TeamForm';
import { PlayerForm } from '@/components/admin/PlayerForm';
import { StadiumForm } from '@/components/admin/StadiumForm';
import { RelatedList } from '@/components/admin/RelatedList';

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
  stadium_id: string;
  stadium_display_name: string | null;
  attended: boolean;
  notes: string | null;
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
  id: string;
  first_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  squad_number: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

interface PlayerHistory {
  id: string;
  player_id: string;
  team_id: number;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
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
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'players' | 'stadiums'>('matches');
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
  const [recentStadiums, setRecentStadiums] = useState<Stadium[]>([]);

  // Matches-specific pagination state
  const [matchesCurrentPage, setMatchesCurrentPage] = useState(1);
  const [matchesTotalPages, setMatchesTotalPages] = useState(1);
  const matchesPerPage = 20;

  // Teams-specific pagination state
  const [teamsCurrentPage, setTeamsCurrentPage] = useState(1);
  const [teamsTotalPages, setTeamsTotalPages] = useState(1);
  const teamsPerPage = 20;

  // Players-specific pagination state
  const [playersCurrentPage, setPlayersCurrentPage] = useState(1);
  const [playersTotalPages, setPlayersTotalPages] = useState(1);
  const playersPerPage = 20;

  // Stadiums-specific pagination state
  const [stadiumsCurrentPage, setStadiumsCurrentPage] = useState(1);
  const [stadiumsTotalPages, setStadiumsTotalPages] = useState(1);
  const stadiumsPerPage = 20;

  // Search state for matches
  const [matchSearch, setMatchSearch] = useState('');

  // Search state for teams
  const [teamSearch, setTeamSearch] = useState('');

  // Search state for players
  const [playerSearch, setPlayerSearch] = useState('');

  // Search state for stadiums
  const [stadiumSearch, setStadiumSearch] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isTeamEditMode, setIsTeamEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [isPlayerEditMode, setIsPlayerEditMode] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [isStadiumEditMode, setIsStadiumEditMode] = useState(false);
  const [editingStadiumId, setEditingStadiumId] = useState<string | null>(null);
  const [editingStadiumNameId, setEditingStadiumNameId] = useState<string | null>(null);

  // Collapsible section state
  const [showExtraTimeSection, setShowExtraTimeSection] = useState(false);
  const [showStatsSection, setShowStatsSection] = useState(false);

  // Create-form visibility state (forms are hidden until "New" is clicked, or an edit is started)
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showStadiumForm, setShowStadiumForm] = useState(false);

  // Match edit tab state
  const [matchEditTab, setMatchEditTab] = useState<'details' | 'related'>('details');

  // Related records state
  const [relatedMedia, setRelatedMedia] = useState<Media[]>([]);
  const [relatedPlayerStats, setRelatedPlayerStats] = useState<PlayerStats[]>([]);

  // Player edit tab state
  const [playerEditTab, setPlayerEditTab] = useState<'details' | 'related'>('details');

  // Player related records state
  const [relatedPlayerStatsForPlayer, setRelatedPlayerStatsForPlayer] = useState<PlayerStats[]>([]);
  const [relatedPlayerHistory, setRelatedPlayerHistory] = useState<PlayerHistory[]>([]);

  // Stadium edit tab state
  const [stadiumEditTab, setStadiumEditTab] = useState<'details' | 'related'>('details');

  // Stadium related records state
  const [relatedStadiumNames, setRelatedStadiumNames] = useState<StadiumName[]>([]);

  // Modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [showPlayerHistoryModal, setShowPlayerHistoryModal] = useState(false);
  const [showStadiumNameModal, setShowStadiumNameModal] = useState(false);
  const [playerStatsContext, setPlayerStatsContext] = useState<'match' | 'player'>('match');
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingPlayerStatsId, setEditingPlayerStatsId] = useState<string | null>(null);
  const [editingPlayerHistoryId, setEditingPlayerHistoryId] = useState<string | null>(null);
  const [newMediaForm, setNewMediaForm] = useState<Partial<Media>>({
    match_id: '',
    type: 'social media',
    title: '',
    url: '',
    caption: '',
    sort_order: 0,
  });
  const [newPlayerStatsForm, setNewPlayerStatsForm] = useState<Partial<PlayerStats>>({
    player_id: '',
    match_id: '',
    team_id: 1,
    started: false,
    captain: false,
    was_substitute: false,
    was_unused_substitute: false,
    minute_on: null,
    minute_off: null,
    minutes_played: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheet: null,
    saves: null,
    shots: 0,
    shots_on_target: 0,
    passes_completed: null,
    passes_attempted: null,
    tackles: null,
    interceptions: null,
    clearances: null,
    fouls_committed: null,
    fouls_won: null,
    offsides: null,
    player_rating: null,
    player_of_the_match: false,
  });
  const [playerStatsFormError, setPlayerStatsFormError] = useState<string | null>(null);

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
    stadium_id: '',
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

  const [teamForm, setTeamForm] = useState<Partial<Team>>({
    name: '',
    short_name: '',
    primary_color: null,
    secondary_color: null,
    is_tottenham: false,
  });

  const [playerForm, setPlayerForm] = useState<Partial<Player>>({
    first_name: '',
    last_name: '',
    date_of_birth: null,
    nationality: null,
    position: null,
    height_cm: null,
    weight_kg: null,
    profile_image_url: null,
    is_active: true,
  });

  const [playerHistoryForm, setPlayerHistoryForm] = useState<Partial<PlayerHistory>>({
    player_id: '',
    team_id: 1,
    joined_on: null,
    left_on: null,
    squad_number: null,
  });
  const [playerHistoryFormError, setPlayerHistoryFormError] = useState<string | null>(null);

  const [stadiumForm, setStadiumForm] = useState<Partial<Stadium>>({
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
  });

  const [stadiumNameForm, setStadiumNameForm] = useState<Partial<StadiumName>>({
    stadium_id: '',
    name: '',
    valid_from: null,
    valid_to: null,
  });
  const [stadiumNameFormError, setStadiumNameFormError] = useState<string | null>(null);

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
    router.push('/spurs-women/login');
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

  // Helper function to group media by type
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

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
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

        if (teamsRes.data) setTeams(teamsRes.data as Team[]);
        if (competitionsRes.data) setCompetitions(competitionsRes.data as Competition[]);
        if (seasonsRes.data) setSeasons(seasonsRes.data as Season[]);
        if (matchesRes.data) setMatches(matchesRes.data as Match[]);
        if (stadiumsRes.data) {
          setStadiums(stadiumsRes.data as Stadium[]);
        } else {
          console.warn('No stadiums data');
        }
        if (stadiumNamesRes.data) setStadiumNames(stadiumNamesRes.data as StadiumName[]);
        if (playersRes.data) {
          setPlayers(playersRes.data as Player[]);
        } else {
          console.warn('No players data received');
        }
      } catch (error) {
        showMessage('Error loading data', 'error');
        console.error('Error loading dropdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  // Functions to fetch recent records for each entity type
  const fetchRecentRecords = useCallback(async () => {
    try {

      // Determine which table to fetch based on active tab
      let tableName = '';
      
      switch (activeTab) {
        case 'players':
          tableName = 'players';
          break;
        case 'stadiums':
          tableName = 'stadia';
          break;
        case 'matches':
        case 'teams':
        default:
          // Matches and teams are already loaded separately
          return;
      }

      if (tableName) {
        // Fetch data via API - map table names to API endpoint names
        const apiEndpointMap: Record<string, string> = {
          'stadia': 'stadia',
        };
        const apiEndpoint = apiEndpointMap[tableName] || tableName;
        const dataRes = await callAdminApi(apiEndpoint, 'GET');

        // Set the appropriate state based on the active tab (store ALL data, not paginated)
        if (dataRes.data) {
          switch (activeTab) {
            case 'stadiums':
              setRecentStadiums(dataRes.data as Stadium[]);
              break;
          }
        } else {
          switch (activeTab) {
            case 'stadiums':
              setRecentStadiums([]);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching recent records:', error);
    }
  }, [activeTab, setRecentStadiums]);

  // Reset pagination and edit modes when tab changes (adjusting state during
  // render, per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    setMatchesCurrentPage(1);
    setMatchesTotalPages(1);
    setTeamsCurrentPage(1);
    setTeamsTotalPages(1);
    setPlayersCurrentPage(1);
    setPlayersTotalPages(1);
    setStadiumsCurrentPage(1);
    setStadiumsTotalPages(1);

    if (activeTab !== 'matches') {
      setIsEditMode(false);
      setEditingMatchId(null);
    }
    if (activeTab !== 'teams') {
      setIsTeamEditMode(false);
      setEditingTeamId(null);
    }
    if (activeTab !== 'players') {
      setIsPlayerEditMode(false);
      setEditingPlayerId(null);
    }
    if (activeTab !== 'stadiums') {
      setIsStadiumEditMode(false);
      setEditingStadiumId(null);
    }

    // Hide all create forms when switching tabs
    setShowMatchForm(false);
    setShowTeamForm(false);
    setShowPlayerForm(false);
    setShowStadiumForm(false);
  }

  // Fetch recent records whenever the active tab changes. fetchRecentRecords
  // only sets state after its internal `await`, so this is a standard async
  // data-fetch effect, not a synchronous setState call.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecentRecords();
  }, [activeTab, fetchRecentRecords]);

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
        match.stadium_display_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [matches, teams, matchSearch]);

  // Helper function for filtering teams (searches across ALL teams)
  const getFilteredTeams = useCallback(() => {
    return teams.filter(team => {
      if (!teamSearch) return true;
      const searchTerm = teamSearch.toLowerCase();
      return (
        team.name?.toLowerCase().includes(searchTerm) ||
        team.short_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [teams, teamSearch]);

  // Helper function for filtering players (searches across ALL players)
  const getFilteredPlayers = useCallback(() => {
    return players.filter(player => {
      if (!playerSearch) return true;
      const searchTerm = playerSearch.toLowerCase();
      return (
        player.first_name?.toLowerCase().includes(searchTerm) ||
        player.last_name?.toLowerCase().includes(searchTerm) ||
        player.position?.toLowerCase().includes(searchTerm) ||
        player.nationality?.toLowerCase().includes(searchTerm)
      );
    });
  }, [players, playerSearch]);

  // Helper function for filtering stadiums (searches across ALL stadiums)
  const getFilteredStadiums = useCallback(() => {
    return recentStadiums.filter(stadium => {
      if (!stadiumSearch) return true;
      const searchTerm = stadiumSearch.toLowerCase();
      return (
        stadium.name?.toLowerCase().includes(searchTerm) ||
        stadium.slug?.toLowerCase().includes(searchTerm) ||
        stadium.city?.toLowerCase().includes(searchTerm) ||
        stadium.country?.toLowerCase().includes(searchTerm)
      );
    });
  }, [recentStadiums, stadiumSearch]);

  // Get paginated matches (applies pagination to filtered results)
  const getPaginatedMatches = () => {
    const filtered = getFilteredMatches();
    const startIndex = (matchesCurrentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated teams (applies pagination to filtered results)
  const getPaginatedTeams = () => {
    const filtered = getFilteredTeams();
    const startIndex = (teamsCurrentPage - 1) * teamsPerPage;
    const endIndex = startIndex + teamsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated players (applies pagination to filtered results)
  const getPaginatedPlayers = () => {
    const filtered = getFilteredPlayers();
    const startIndex = (playersCurrentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated stadiums (applies pagination to filtered results)
  const getPaginatedStadiums = () => {
    const filtered = getFilteredStadiums();
    const startIndex = (stadiumsCurrentPage - 1) * stadiumsPerPage;
    const endIndex = startIndex + stadiumsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Update matches/teams/players/stadiums pagination when search or data changes
  // (adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const newMatchesTotalPages = Math.ceil(getFilteredMatches().length / matchesPerPage);
  if (newMatchesTotalPages !== matchesTotalPages) {
    setMatchesTotalPages(newMatchesTotalPages);
    if (matchesCurrentPage > newMatchesTotalPages && newMatchesTotalPages > 0) {
      setMatchesCurrentPage(1);
    }
  }

  const newTeamsTotalPages = Math.ceil(getFilteredTeams().length / teamsPerPage);
  if (newTeamsTotalPages !== teamsTotalPages) {
    setTeamsTotalPages(newTeamsTotalPages);
    if (teamsCurrentPage > newTeamsTotalPages && newTeamsTotalPages > 0) {
      setTeamsCurrentPage(1);
    }
  }

  const newPlayersTotalPages = Math.ceil(getFilteredPlayers().length / playersPerPage);
  if (newPlayersTotalPages !== playersTotalPages) {
    setPlayersTotalPages(newPlayersTotalPages);
    if (playersCurrentPage > newPlayersTotalPages && newPlayersTotalPages > 0) {
      setPlayersCurrentPage(1);
    }
  }

  const newStadiumsTotalPages = Math.ceil(getFilteredStadiums().length / stadiumsPerPage);
  if (newStadiumsTotalPages !== stadiumsTotalPages) {
    setStadiumsTotalPages(newStadiumsTotalPages);
    if (stadiumsCurrentPage > newStadiumsTotalPages && newStadiumsTotalPages > 0) {
      setStadiumsCurrentPage(1);
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await callAdminApi('matches', 'DELETE', { id: matchId });
      showMessage('Match deleted successfully', 'success');

      // Reload matches data
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
  };

  const handleEditMatch = async (match: Match) => {
    setIsEditMode(true);
    setShowMatchForm(true);
    setEditingMatchId(match.id);
    setMatchEditTab('details');
    window.scrollTo({
      top: 250,
      left: 0,
      behavior: "smooth",
    });
    
    // Try to match the stadium by comparing stadium_id with stadium_display_name
    const matchedStadium = stadiums.find(s => {
      const currentName = getCurrentStadiumName(s.id, match.date);
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
    
    // Use the stadium_id for the form value
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

    // Fetch related records
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
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setShowMatchForm(false);
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
    });
  };

  const handleDeleteMedia = async (mediaId: string) => {
    setLoading(true);
    try {
      await callAdminApi('media', 'DELETE', { id: mediaId });
      showMessage('Media deleted successfully', 'success');

      // Reload related media data
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
  };

  const handleDeleteTeam = async (teamId: number) => {
    setLoading(true);
    try {
      await callAdminApi('teams', 'DELETE', { id: teamId });
      showMessage('Team deleted successfully', 'success');

      // Reload teams data
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
  };

  const handleEditTeam = (team: Team) => {
    setIsTeamEditMode(true);
    setShowTeamForm(true);
    setEditingTeamId(team.id);
    window.scrollTo({
      top: 250,
      left: 0,
      behavior: "smooth",
    });
    setTeamForm({
      name: team.name,
      short_name: team.short_name,
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
      is_tottenham: team.is_tottenham,
    });
  };

  const handleCancelEditTeam = () => {
    setIsTeamEditMode(false);
    setShowTeamForm(false);
    setEditingTeamId(null);
    setTeamForm({
      name: '',
      short_name: '',
      primary_color: null,
      secondary_color: null,
      is_tottenham: false,
    });
  };

  const handleDeletePlayer = async (playerId: string) => {
    setLoading(true);
    try {
      await callAdminApi('players', 'DELETE', { id: playerId });
      showMessage('Player deleted successfully', 'success');

      // Reload players data
      try {
        const playersResponse = await callAdminApi('players', 'GET');
        if (playersResponse.data) setPlayers(playersResponse.data as Player[]);
      } catch (error) {
        console.error('Error reloading players:', error);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      showMessage('Error deleting player', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = async (player: Player) => {
    setIsPlayerEditMode(true);
    setShowPlayerForm(true);
    setEditingPlayerId(player.id);
    setPlayerEditTab('details');
    window.scrollTo({
      top: 250,
      left: 0,
      behavior: "smooth",
    });

    // Fetch related records
    try {
      const [playerStatsRes, playerHistoryRes] = await Promise.all([
        callAdminApi('player-stats', 'GET'),
        callAdminApi('player-history', 'GET'),
      ]);

      if (playerStatsRes.data) {
        const allPlayerStats = playerStatsRes.data as PlayerStats[];
        setRelatedPlayerStatsForPlayer(allPlayerStats.filter(ps => ps.player_id === player.id));
      }

      if (playerHistoryRes.data) {
        const allPlayerHistory = playerHistoryRes.data as PlayerHistory[];
        setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === player.id));
      }
    } catch (error) {
      console.error('Error fetching related records:', error);
    }
    setPlayerForm({
      first_name: player.first_name,
      last_name: player.last_name,
      date_of_birth: player.date_of_birth,
      nationality: player.nationality,
      position: player.position,
      height_cm: player.height_cm,
      weight_kg: player.weight_kg,
      profile_image_url: player.profile_image_url,
      is_active: player.is_active,
    });
  };

  const handleCancelEditPlayer = () => {
    setIsPlayerEditMode(false);
    setShowPlayerForm(false);
    setEditingPlayerId(null);
    setPlayerForm({
      first_name: '',
      last_name: '',
      date_of_birth: null,
      nationality: null,
      position: null,
      height_cm: null,
      weight_kg: null,
      profile_image_url: null,
      is_active: true,
    });
  };

  const handleDeletePlayerStats = async (playerStatsId: string) => {
    setLoading(true);
    try {
      await callAdminApi('player-stats', 'DELETE', { id: playerStatsId });
      showMessage('Player stats deleted successfully', 'success');

      // Reload related player stats data
      try {
        const playerStatsResponse = await callAdminApi('player-stats', 'GET');
        if (playerStatsResponse.data) {
          const allPlayerStats = playerStatsResponse.data as PlayerStats[];
          if (playerStatsContext === 'match' && editingMatchId) {
            setRelatedPlayerStats(allPlayerStats.filter(ps => ps.match_id === editingMatchId));
          } else if (playerStatsContext === 'player' && editingPlayerId) {
            setRelatedPlayerStatsForPlayer(allPlayerStats.filter(ps => ps.player_id === editingPlayerId));
          }
        }
      } catch (error) {
        console.error('Error reloading player stats:', error);
      }
    } catch (error) {
      console.error('Error deleting player stats:', error);
      showMessage('Error deleting player stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayerHistory = async (playerHistoryId: string) => {
    setLoading(true);
    try {
      await callAdminApi('player-history', 'DELETE', { id: playerHistoryId });
      showMessage('Player history deleted successfully', 'success');

      // Reload related player history data
      try {
        const playerHistoryResponse = await callAdminApi('player-history', 'GET');
        if (playerHistoryResponse.data) {
          const allPlayerHistory = playerHistoryResponse.data as PlayerHistory[];
          setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === editingPlayerId));
        }
      } catch (error) {
        console.error('Error reloading player history:', error);
      }
    } catch (error) {
      console.error('Error deleting player history:', error);
      showMessage('Error deleting player history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStadium = async (stadiumId: string) => {
    setLoading(true);
    try {
      await callAdminApi('stadia', 'DELETE', { id: stadiumId });
      showMessage('Stadium deleted successfully', 'success');

      // Reload stadiums data
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
  };

  const handleEditStadium = async (stadium: Stadium) => {
    setIsStadiumEditMode(true);
    setShowStadiumForm(true);
    setEditingStadiumId(stadium.id);
    setStadiumEditTab('details');
    window.scrollTo({
      top: 250,
      left: 0,
      behavior: "smooth",
    });

    // Fetch related records
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
  };

  const handleCancelEditStadium = () => {
    setIsStadiumEditMode(false);
    setShowStadiumForm(false);
    setEditingStadiumId(null);
    setStadiumForm({
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
    });
  };

  const handleDeleteStadiumName = async (stadiumNameId: string) => {
    setLoading(true);
    try {
      await callAdminApi('stadium-names', 'DELETE', { id: stadiumNameId });
      showMessage('Stadium name deleted successfully', 'success');

      // Reload stadium names data
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
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
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
        // Update existing team
        response = await fetch('/api/admin/teams', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingTeamId, ...payload }),
        });
      } else {
        // Create new team
        response = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isTeamEditMode ? 'update' : 'create'} team`);
      }

      showMessage(isTeamEditMode ? 'Team updated successfully' : 'Team created successfully', 'success');
      
      // Reset form and edit mode
      handleCancelEditTeam();
      
      // Reload teams data
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
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        first_name: playerForm.first_name || null,
        last_name: playerForm.last_name,
        date_of_birth: playerForm.date_of_birth || null,
        nationality: playerForm.nationality || null,
        position: playerForm.position || null,
        height_cm: playerForm.height_cm || null,
        weight_kg: playerForm.weight_kg || null,
        profile_image_url: playerForm.profile_image_url || null,
        is_active: playerForm.is_active !== undefined ? playerForm.is_active : true,
      };

      let response;
      if (isPlayerEditMode && editingPlayerId) {
        // Update existing player
        response = await fetch('/api/admin/players', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingPlayerId, ...payload }),
        });
      } else {
        // Create new player
        response = await fetch('/api/admin/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isPlayerEditMode ? 'update' : 'create'} player`);
      }

      showMessage(isPlayerEditMode ? 'Player updated successfully' : 'Player created successfully', 'success');
      
      // Reset form and edit mode
      handleCancelEditPlayer();
      
      // Reload players data
      try {
        const playersResponse = await fetch('/api/admin/players');
        const playersResult = await playersResponse.json();
        if (playersResult.data) setPlayers(playersResult.data as Player[]);
      } catch (error) {
        console.error('Error reloading players:', error);
      }
    } catch (error) {
      console.error(`Error ${isPlayerEditMode ? 'updating' : 'creating'} player:`, error);
      
      let errorMessage = isPlayerEditMode ? 'Error updating player' : 'Error creating player';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error.code}`;
        } else {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error}`;
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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

      const payload = buildMatchPayload(matchForm, spursTeam);

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
  };


  return (
    <div className="p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
          <h1 className="spurs-text text-3xl font-bold">Spurs Women Admin</h1>
          {user && (
            <div className="flex flex-wrap items-center justify-end gap-4">
              <Link href="/spurs-women/profile" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--spurs-dark-accent)' }}>
                {user.email}
              </Link>
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

        {/* Message Display - fixed above modals (z-50) so it's visible even while one is open */}
        {message && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] p-4 rounded shadow-lg ${
            message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-between items-center border-b border-gray-600 mb-8 gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                activeTab === 'matches'
                  ? 'spurs-text'
                  : 'text-gray-300 hover:text-spurs-dark-accent'
              }`}
              style={{
                backgroundColor: activeTab === 'matches' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                borderBottomColor: activeTab === 'matches' ? 'var(--spurs-dark-accent)' : 'transparent',
                borderBottomWidth: activeTab === 'matches' ? '2px' : '0',
                color: activeTab === 'matches' ? 'var(--spurs-dark-accent)' : '#d1d5db'
              }}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                activeTab === 'teams'
                  ? 'spurs-text'
                  : 'text-gray-300 hover:text-spurs-dark-accent'
              }`}
              style={{
                backgroundColor: activeTab === 'teams' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                borderBottomColor: activeTab === 'teams' ? 'var(--spurs-dark-accent)' : 'transparent',
                borderBottomWidth: activeTab === 'teams' ? '2px' : '0',
                color: activeTab === 'teams' ? 'var(--spurs-dark-accent)' : '#d1d5db'
              }}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                activeTab === 'players'
                  ? 'spurs-text'
                  : 'text-gray-300 hover:text-spurs-dark-accent'
              }`}
              style={{
                backgroundColor: activeTab === 'players' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                borderBottomColor: activeTab === 'players' ? 'var(--spurs-dark-accent)' : 'transparent',
                borderBottomWidth: activeTab === 'players' ? '2px' : '0',
                color: activeTab === 'players' ? 'var(--spurs-dark-accent)' : '#d1d5db'
              }}
            >
              Players
            </button>
            <button
              onClick={() => setActiveTab('stadiums')}
              className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                activeTab === 'stadiums'
                  ? 'spurs-text'
                  : 'text-gray-300 hover:text-spurs-dark-accent'
              }`}
              style={{
                backgroundColor: activeTab === 'stadiums' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                borderBottomColor: activeTab === 'stadiums' ? 'var(--spurs-dark-accent)' : 'transparent',
                borderBottomWidth: activeTab === 'stadiums' ? '2px' : '0',
                color: activeTab === 'stadiums' ? 'var(--spurs-dark-accent)' : '#d1d5db'
              }}
            >
              Stadiums
            </button>
          </div>

          {activeTab === 'matches' && !isEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showMatchForm ? handleCancelEdit() : setShowMatchForm(true))}>
              {showMatchForm ? 'Cancel' : '+ New Match'}
            </Button>
          )}
          {activeTab === 'teams' && !isTeamEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showTeamForm ? handleCancelEditTeam() : setShowTeamForm(true))}>
              {showTeamForm ? 'Cancel' : '+ New Team'}
            </Button>
          )}
          {activeTab === 'players' && !isPlayerEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showPlayerForm ? handleCancelEditPlayer() : setShowPlayerForm(true))}>
              {showPlayerForm ? 'Cancel' : '+ New Player'}
            </Button>
          )}
          {activeTab === 'stadiums' && !isStadiumEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showStadiumForm ? handleCancelEditStadium() : setShowStadiumForm(true))}>
              {showStadiumForm ? 'Cancel' : '+ New Stadium'}
            </Button>
          )}
        </div>

        {/* Match Form */}
        {activeTab === 'matches' && (
          <>
            {isEditMode && (
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => setMatchEditTab('details')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    matchEditTab === 'details'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: matchEditTab === 'details' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: matchEditTab === 'details' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: matchEditTab === 'details' ? '2px' : '0',
                    color: matchEditTab === 'details' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Details
                </button>
                <button
                  onClick={() => setMatchEditTab('related')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    matchEditTab === 'related'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: matchEditTab === 'related' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: matchEditTab === 'related' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: matchEditTab === 'related' ? '2px' : '0',
                    color: matchEditTab === 'related' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Related Records
                </button>
              </div>
            )}
            
            {matchEditTab === 'details' && (isEditMode || showMatchForm) && (
              <MatchForm
                matchForm={matchForm}
                setMatchForm={setMatchForm}
                seasons={seasons}
                competitions={competitions}
                teams={teams}
                stadiums={stadiums}
                isEditMode={isEditMode}
                editingMatchId={editingMatchId}
                loading={loading}
                showStatsSection={showStatsSection}
                showExtraTimeSection={showExtraTimeSection}
                setShowStatsSection={setShowStatsSection}
                setShowExtraTimeSection={setShowExtraTimeSection}
                getCurrentStadiumName={getCurrentStadiumName}
                onSubmit={handleMatchSubmit}
                onDelete={() => {
                  if (confirm('Are you sure you want to delete this match?')) {
                    handleDeleteMatch(editingMatchId!);
                  }
                }}
                onCancel={handleCancelEdit}
              />
            )}
            
            {matchEditTab === 'related' && isEditMode && (
              <div className="space-y-4">
                {/* Media related lists grouped by type */}
                {Object.entries(getMediaByType()).map(([mediaType, mediaRecords]) => (
                  <RelatedList
                    key={mediaType}
                    title={`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
                    records={mediaRecords}
                    columns={[
                      { key: 'title', label: 'Title' },
                      { key: 'url', label: 'URL', render: (value: unknown) => {
                        const url = value as string;
                        return (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="spurs-text hover:underline">
                            {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                          </a>
                        );
                      }},
                      { key: 'sort_order', label: 'Sort Order' },
                    ]}
                    onNew={() => {
                      setNewMediaForm({
                        match_id: editingMatchId!,
                        type: mediaType as Media['type'],
                        title: '',
                        url: '',
                        caption: '',
                        sort_order: 0,
                      });
                      setShowMediaModal(true);
                    }}
                    onRecordClick={(media) => {
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
                    }}
                    emptyMessage={`No ${mediaType} records found`}
                  />
                ))}
                
                {/* Player Stats related list */}
                <RelatedList
                  title="Player Stats"
                  records={relatedPlayerStats}
                  columns={[
                    {
                      key: 'player_id',
                      label: 'Player',
                      render: (value: unknown) => {
                        const playerId = value as string;
                        const player = players.find(p => p.id === playerId);
                        return player ? `${player.first_name} ${player.last_name}` : playerId;
                      }
                    },
                    { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
                    { key: 'captain', label: 'Captain', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
                    { key: 'goals', label: 'Goals' },
                    { key: 'assists', label: 'Assists' },
                  ]}
                  onNew={() => {
                    setNewPlayerStatsForm({
                      player_id: '',
                      match_id: editingMatchId!,
                      team_id: 1,
                      started: false,
                      captain: false,
                      was_substitute: false,
                      was_unused_substitute: false,
                      minute_on: null,
                      minute_off: null,
                      minutes_played: 0,
                      goals: 0,
                      assists: 0,
                      yellow_cards: 0,
                      red_cards: 0,
                      clean_sheet: null,
                      saves: null,
                      shots: 0,
                      shots_on_target: 0,
                      passes_completed: null,
                      passes_attempted: null,
                      tackles: null,
                      interceptions: null,
                      clearances: null,
                      fouls_committed: null,
                      fouls_won: null,
                      offsides: null,
                      player_rating: null,
                      player_of_the_match: false,
                    });
                    setPlayerStatsFormError(null);
                    setShowPlayerStatsModal(true);
                  }}
                  onRecordClick={(stat) => {
                    setEditingPlayerStatsId(stat.id);
                    setNewPlayerStatsForm({
                      player_id: stat.player_id,
                      match_id: stat.match_id,
                      team_id: stat.team_id,
                      started: stat.started,
                      captain: stat.captain,
                      was_substitute: stat.was_substitute,
                      was_unused_substitute: stat.was_unused_substitute,
                      minute_on: stat.minute_on,
                      minute_off: stat.minute_off,
                      minutes_played: stat.minutes_played,
                      goals: stat.goals,
                      assists: stat.assists,
                      yellow_cards: stat.yellow_cards,
                      red_cards: stat.red_cards,
                      clean_sheet: stat.clean_sheet,
                      saves: stat.saves,
                      shots: stat.shots,
                      shots_on_target: stat.shots_on_target,
                      passes_completed: stat.passes_completed,
                      passes_attempted: stat.passes_attempted,
                      tackles: stat.tackles,
                      interceptions: stat.interceptions,
                      clearances: stat.clearances,
                      fouls_committed: stat.fouls_committed,
                      fouls_won: stat.fouls_won,
                      offsides: stat.offsides,
                      player_rating: stat.player_rating,
                      player_of_the_match: stat.player_of_the_match,
                    });
                    setPlayerStatsFormError(null);
                    setShowPlayerStatsModal(true);
                  }}
                  emptyMessage="No player stats records found"
                />
              </div>
            )}
          </>
        )}

        {/* Team Form */}
        {activeTab === 'teams' && (
          <>
            {(isTeamEditMode || showTeamForm) && (
              <TeamForm
                teamForm={teamForm}
                setTeamForm={setTeamForm}
                isTeamEditMode={isTeamEditMode}
                editingTeamId={editingTeamId}
                loading={loading}
                onSubmit={handleTeamSubmit}
                onDelete={() => {
                  if (editingTeamId && confirm('Are you sure you want to delete this team?')) {
                    handleDeleteTeam(editingTeamId);
                  }
                }}
                onCancel={handleCancelEditTeam}
              />
            )}
          </>
        )}

        {/* Player Form */}
        {activeTab === 'players' && (
          <>
            {isPlayerEditMode && (
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => setPlayerEditTab('details')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    playerEditTab === 'details'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: playerEditTab === 'details' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: playerEditTab === 'details' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: playerEditTab === 'details' ? '2px' : '0',
                    color: playerEditTab === 'details' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Details
                </button>
                <button
                  onClick={() => setPlayerEditTab('related')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    playerEditTab === 'related'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: playerEditTab === 'related' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: playerEditTab === 'related' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: playerEditTab === 'related' ? '2px' : '0',
                    color: playerEditTab === 'related' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Related Records
                </button>
              </div>
            )}

            {playerEditTab === 'details' && (isPlayerEditMode || showPlayerForm) && (
              <PlayerForm
                playerForm={playerForm}
                setPlayerForm={setPlayerForm}
                isPlayerEditMode={isPlayerEditMode}
                editingPlayerId={editingPlayerId}
                loading={loading}
                onSubmit={handlePlayerSubmit}
                onDelete={() => {
                  if (editingPlayerId && confirm('Are you sure you want to delete this player?')) {
                    handleDeletePlayer(editingPlayerId);
                  }
                }}
                onCancel={handleCancelEditPlayer}
              />
            )}

            {playerEditTab === 'related' && isPlayerEditMode && (
              <div className="space-y-4">
                {/* Player Stats related list */}
                <RelatedList
                  title="Player Stats"
                  records={relatedPlayerStatsForPlayer}
                  columns={[
                    {
                      key: 'match_id',
                      label: 'Match',
                      render: (value: unknown) => {
                        const matchId = value as string;
                        const match = matches.find(m => m.id === matchId);
                        return match ? `${match.date}` : matchId;
                      }
                    },
                    {
                      key: 'match_id',
                      id: 'opponent',
                      label: 'Opponent',
                      render: (value: unknown, stat: PlayerStats) => {
                        const match = matches.find(m => m.id === (value as string));
                        if (!match) return '-';
                        const opponentTeamId = match.home_team_id === stat.team_id
                          ? match.away_team_id
                          : match.home_team_id;
                        const opponentTeam = teams.find(t => t.id === opponentTeamId);
                        return opponentTeam?.short_name || opponentTeam?.name || '-';
                      }
                    },
                    { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
                    { key: 'goals', label: 'Goals' },
                    { key: 'assists', label: 'Assists' },
                  ]}
                  onNew={() => {
                    setNewPlayerStatsForm({
                      player_id: editingPlayerId!,
                      match_id: '',
                      team_id: 1,
                      started: false,
                      captain: false,
                      was_substitute: false,
                      was_unused_substitute: false,
                      minute_on: null,
                      minute_off: null,
                      minutes_played: 0,
                      goals: 0,
                      assists: 0,
                      yellow_cards: 0,
                      red_cards: 0,
                      clean_sheet: null,
                      saves: null,
                      shots: 0,
                      shots_on_target: 0,
                      passes_completed: null,
                      passes_attempted: null,
                      tackles: null,
                      interceptions: null,
                      clearances: null,
                      fouls_committed: null,
                      fouls_won: null,
                      offsides: null,
                      player_rating: null,
                      player_of_the_match: false,
                    });
                    setPlayerStatsContext('player');
                    setPlayerStatsFormError(null);
                    setShowPlayerStatsModal(true);
                  }}
                  onRecordClick={(stat) => {
                    setEditingPlayerStatsId(stat.id);
                    setNewPlayerStatsForm({
                      player_id: stat.player_id,
                      match_id: stat.match_id,
                      team_id: stat.team_id,
                      started: stat.started,
                      captain: stat.captain,
                      was_substitute: stat.was_substitute,
                      was_unused_substitute: stat.was_unused_substitute,
                      minute_on: stat.minute_on,
                      minute_off: stat.minute_off,
                      minutes_played: stat.minutes_played,
                      goals: stat.goals,
                      assists: stat.assists,
                      yellow_cards: stat.yellow_cards,
                      red_cards: stat.red_cards,
                      clean_sheet: stat.clean_sheet,
                      saves: stat.saves,
                      shots: stat.shots,
                      shots_on_target: stat.shots_on_target,
                      passes_completed: stat.passes_completed,
                      passes_attempted: stat.passes_attempted,
                      tackles: stat.tackles,
                      interceptions: stat.interceptions,
                      clearances: stat.clearances,
                      fouls_committed: stat.fouls_committed,
                      fouls_won: stat.fouls_won,
                      offsides: stat.offsides,
                      player_rating: stat.player_rating,
                      player_of_the_match: stat.player_of_the_match,
                    });
                    setPlayerStatsContext('player');
                    setPlayerStatsFormError(null);
                    setShowPlayerStatsModal(true);
                  }}
                  emptyMessage="No player stats records found"
                />

                {/* Player History related list */}
                <RelatedList
                  title="Player History"
                  records={relatedPlayerHistory}
                  columns={[
                    {
                      key: 'team_id',
                      label: 'Team',
                      render: (value: unknown) => {
                        const teamId = value as number;
                        const team = teams.find(t => t.id === teamId);
                        return team ? team.name : teamId.toString();
                      }
                    },
                    { key: 'joined_on', label: 'Joined On' },
                    { key: 'left_on', label: 'Left On' },
                    { key: 'squad_number', label: 'Squad Number' },
                  ]}
                  onNew={() => {
                    setPlayerHistoryForm({
                      player_id: editingPlayerId!,
                      team_id: 1,
                      joined_on: '',
                      left_on: '',
                      squad_number: null,
                    });
                    setEditingPlayerHistoryId(null);
                    setPlayerHistoryFormError(null);
                    setShowPlayerHistoryModal(true);
                  }}
                  onRecordClick={(history) => {
                    setEditingPlayerHistoryId(history.id);
                    setPlayerHistoryForm({
                      player_id: history.player_id,
                      team_id: history.team_id,
                      joined_on: history.joined_on,
                      left_on: history.left_on,
                      squad_number: history.squad_number,
                    });
                    setPlayerHistoryFormError(null);
                    setShowPlayerHistoryModal(true);
                  }}
                  emptyMessage="No player history records found"
                />
              </div>
            )}
          </>
        )}

        {/* Stadium Form */}
        {activeTab === 'stadiums' && (
          <>
            {isStadiumEditMode && (
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => setStadiumEditTab('details')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    stadiumEditTab === 'details'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: stadiumEditTab === 'details' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: stadiumEditTab === 'details' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: stadiumEditTab === 'details' ? '2px' : '0',
                    color: stadiumEditTab === 'details' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Details
                </button>
                <button
                  onClick={() => setStadiumEditTab('related')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    stadiumEditTab === 'related'
                      ? 'spurs-text'
                      : 'text-gray-300 hover:text-spurs-dark-accent'
                  }`}
                  style={{
                    backgroundColor: stadiumEditTab === 'related' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    borderBottomColor: stadiumEditTab === 'related' ? 'var(--spurs-dark-accent)' : 'transparent',
                    borderBottomWidth: stadiumEditTab === 'related' ? '2px' : '0',
                    color: stadiumEditTab === 'related' ? 'var(--spurs-dark-accent)' : '#d1d5db'
                  }}
                >
                  Related Records
                </button>
              </div>
            )}

            {stadiumEditTab === 'details' && (isStadiumEditMode || showStadiumForm) && (
              <StadiumForm
                teams={teams}
                stadiumForm={stadiumForm}
                setStadiumForm={setStadiumForm}
                isStadiumEditMode={isStadiumEditMode}
                editingStadiumId={editingStadiumId}
                loading={loading}
                onSubmit={async (e) => {
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
                      // Update existing stadium
                      const response = await fetch('/api/admin/stadia', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: editingStadiumId, ...payload }),
                      });
                      if (!response.ok) {
                        throw new Error('Failed to update stadium');
                      }
                      showMessage('Stadium updated successfully', 'success');
                    } else {
                      // Create new stadium
                      await createEntityAndReload('stadia', payload, 'stadia', setStadiums);
                      showMessage('Stadium created successfully', 'success');
                    }

                    // Reload stadiums data
                    try {
                      const stadiumsRes = await callAdminApi('stadia', 'GET');
                      if (stadiumsRes.data) {
                        setStadiums(stadiumsRes.data as Stadium[]);
                        setRecentStadiums(stadiumsRes.data as Stadium[]);
                      }
                    } catch (error) {
                      console.error('Error reloading stadiums:', error);
                    }

                    // Reset form
                    handleCancelEditStadium();
                  } catch (error) {
                    showMessage(isStadiumEditMode ? 'Error updating stadium' : 'Error creating stadium', 'error');
                    console.error('Error saving stadium:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                onDelete={() => {
                  if (editingStadiumId && confirm('Are you sure you want to delete this stadium?')) {
                    handleDeleteStadium(editingStadiumId);
                  }
                }}
                onCancel={handleCancelEditStadium}
              />
            )}

            {stadiumEditTab === 'related' && isStadiumEditMode && (
              <div className="space-y-4">
                {/* Stadium Names related list */}
                <RelatedList
                  title="Stadium Names"
                  records={relatedStadiumNames}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'valid_from', label: 'Valid From' },
                    { key: 'valid_to', label: 'Valid To' },
                  ]}
                  onNew={() => {
                    setStadiumNameForm({
                      stadium_id: editingStadiumId!,
                      name: '',
                      valid_from: '',
                      valid_to: null,
                    });
                    setEditingStadiumNameId(null);
                    setStadiumNameFormError(null);
                    setShowStadiumNameModal(true);
                  }}
                  onRecordClick={(stadiumName) => {
                    setEditingStadiumNameId(stadiumName.id);
                    setStadiumNameForm({
                      stadium_id: stadiumName.stadium_id,
                      name: stadiumName.name,
                      valid_from: stadiumName.valid_from,
                      valid_to: stadiumName.valid_to,
                    });
                    setStadiumNameFormError(null);
                    setShowStadiumNameModal(true);
                  }}
                  emptyMessage="No stadium names found"
                />
              </div>
            )}
          </>
        )}

        {/* Recent Records Preview */}
        <div className="mt-8 spurs-accent-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold spurs-text">
              {activeTab === 'matches'
                ? (matchSearch ? `All Matches (${getFilteredMatches().length} filtered)` : 'All Matches')
                : activeTab === 'teams' ? (teamSearch ? `All Teams (${getFilteredTeams().length} filtered)` : 'All Teams') :
                activeTab === 'players' ? (playerSearch ? `All Players (${getFilteredPlayers().length} filtered)` : 'All Players') :
                activeTab === 'stadiums' ? (stadiumSearch ? `All Stadiums (${getFilteredStadiums().length} filtered)` : 'All Stadiums') :
                'Recent Records'}
            </h3>
          </div>
          {activeTab === 'matches' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search matches by date, opponent, or stadium..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'teams' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search teams by name or short name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'players' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search players by name, position, or nationality..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'stadiums' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search stadiums by name, slug, city, or country..."
                value={stadiumSearch}
                onChange={(e) => setStadiumSearch(e.target.value)}
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
                  {activeTab === 'stadiums' && (
                    <>
                      <th className="text-left p-2 spurs-text">Name</th>
                      <th className="text-left p-2 spurs-text">City</th>
                      <th className="text-left p-2 spurs-text">Capacity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'matches' && getPaginatedMatches().map(match => {
                  const homeTeam = teams.find(t => t.id === match.home_team_id);
                  const awayTeam = teams.find(t => t.id === match.away_team_id);
                  const competition = competitions.find(c => c.id === match.competition_id);
                  const displayVenue = match.stadium_display_name;

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
                {activeTab === 'teams' && (
                  <>
                    {getPaginatedTeams().length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-gray-400">
                          No teams found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedTeams().map(team => {
                        return (
                          <tr 
                            key={team.id} 
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditTeam(team)}
                          >
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
                      })
                    )}
                  </>
                )}
                {activeTab === 'players' && (
                  <>
                    {getPaginatedPlayers().length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-gray-400">
                          No players found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedPlayers().map(player => {
                        return (
                          <tr 
                            key={player.id} 
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <td className="p-2 spurs-text">{player.first_name ? `${player.first_name} ` : ''}{player.last_name}</td>
                            <td className="p-2 spurs-text">{player.position || '-'}</td>
                            <td className="p-2 spurs-text">{player.nationality || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </>
                )}
                {activeTab === 'stadiums' && (
                  <>
                    {getPaginatedStadiums().length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-gray-400">
                          No stadiums found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedStadiums().map(stadium => {
                        return (
                          <tr
                            key={stadium.id}
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditStadium(stadium)}
                          >
                            <td className="p-2 spurs-text">{stadium.name}</td>
                            <td className="p-2 spurs-text">{stadium.city || '-'}</td>
                            <td className="p-2 spurs-text">{stadium.capacity || '-'}</td>
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
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setMatchesCurrentPage(matchesCurrentPage - 1)}
                  disabled={matchesCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {matchesCurrentPage} of {matchesTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setMatchesCurrentPage(matchesCurrentPage + 1)}
                  disabled={matchesCurrentPage === matchesTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'teams' && teamsTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((teamsCurrentPage - 1) * teamsPerPage) + 1} to {Math.min(teamsCurrentPage * teamsPerPage, getFilteredTeams().length)} of {getFilteredTeams().length} teams
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setTeamsCurrentPage(teamsCurrentPage - 1)}
                  disabled={teamsCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {teamsCurrentPage} of {teamsTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setTeamsCurrentPage(teamsCurrentPage + 1)}
                  disabled={teamsCurrentPage === teamsTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'players' && playersTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((playersCurrentPage - 1) * playersPerPage) + 1} to {Math.min(playersCurrentPage * playersPerPage, getFilteredPlayers().length)} of {getFilteredPlayers().length} players
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayersCurrentPage(playersCurrentPage - 1)}
                  disabled={playersCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {playersCurrentPage} of {playersTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayersCurrentPage(playersCurrentPage + 1)}
                  disabled={playersCurrentPage === playersTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'stadiums' && stadiumsTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((stadiumsCurrentPage - 1) * stadiumsPerPage) + 1} to {Math.min(stadiumsCurrentPage * stadiumsPerPage, getFilteredStadiums().length)} of {getFilteredStadiums().length} stadiums
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setStadiumsCurrentPage(stadiumsCurrentPage - 1)}
                  disabled={stadiumsCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {stadiumsCurrentPage} of {stadiumsTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setStadiumsCurrentPage(stadiumsCurrentPage + 1)}
                  disabled={stadiumsCurrentPage === stadiumsTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingMediaId ? 'Edit Media' : 'Add New Media'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={newMediaForm.type}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, type: e.target.value as Media['type'] })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="photo">Photo</option>
                  <option value="photo album">Photo Album</option>
                  <option value="article">Article</option>
                  <option value="social media">Social Media</option>
                  <option value="video-external">Video (External)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newMediaForm.title || ''}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                <input
                  type="text"
                  value={newMediaForm.url || ''}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Caption</label>
                <textarea
                  value={newMediaForm.caption || ''}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, caption: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={newMediaForm.sort_order}
                  onChange={(e) => setNewMediaForm({ ...newMediaForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              {editingMediaId && (
                <Button
                  variant="spurs"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this media item?')) {
                      handleDeleteMedia(editingMediaId);
                      setShowMediaModal(false);
                      setEditingMediaId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="spurs" onClick={() => {
                setShowMediaModal(false);
                setEditingMediaId(null);
                setNewMediaForm({
                  match_id: '',
                  type: 'social media',
                  title: '',
                  url: '',
                  caption: '',
                  sort_order: 0,
                });
              }}>
                Cancel
              </Button>
              <Button
                variant="spurs"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = editingMediaId
                      ? await callAdminApi('media', 'PUT', { id: editingMediaId, ...newMediaForm })
                      : await callAdminApi('media', 'POST', newMediaForm);
                    if (response.error) {
                      showMessage(response.error, 'error');
                    } else {
                      showMessage(editingMediaId ? 'Media updated successfully' : 'Media created successfully', 'success');
                      setShowMediaModal(false);
                      setEditingMediaId(null);
                      setNewMediaForm({
                        match_id: '',
                        type: 'social media',
                        title: '',
                        url: '',
                        caption: '',
                        sort_order: 0,
                      });
                      // Reload media to update related records
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
                }}
              >
                {editingMediaId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Player Stats Modal */}
      {showPlayerStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingPlayerStatsId ? 'Edit Player Stats' : 'Add Player Stats'}
            </h3>
            {playerStatsFormError && (
              <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
                {playerStatsFormError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Player</label>
                <select
                  value={newPlayerStatsForm.player_id}
                  onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, player_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select a player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.first_name} {player.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Match</label>
                <select
                  value={newPlayerStatsForm.match_id}
                  onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, match_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select a match</option>
                  {matches.map((match) => {
                    const homeTeam = teams.find(t => t.id === match.home_team_id);
                    const awayTeam = teams.find(t => t.id === match.away_team_id);
                    return (
                      <option key={match.id} value={match.id}>
                        {match.date} - {homeTeam?.short_name || 'TBC'} vs {awayTeam?.short_name || 'TBC'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Started</label>
                  <select
                    value={newPlayerStatsForm.started ? 'true' : 'false'}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, started: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Captain</label>
                  <select
                    value={newPlayerStatsForm.captain ? 'true' : 'false'}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, captain: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Goals</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.goals}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, goals: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assists</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.assists}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, assists: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Yellow Cards</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.yellow_cards}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, yellow_cards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Red Cards</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.red_cards}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, red_cards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minute On</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.minute_on || ''}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, minute_on: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minute Off</label>
                  <input
                    type="number"
                    value={newPlayerStatsForm.minute_off || ''}
                    onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, minute_off: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Player Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={newPlayerStatsForm.player_rating || ''}
                  onChange={(e) => setNewPlayerStatsForm({ ...newPlayerStatsForm, player_rating: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              {editingPlayerStatsId && (
                <Button
                  variant="spurs"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this player stats record?')) {
                      handleDeletePlayerStats(editingPlayerStatsId);
                      setShowPlayerStatsModal(false);
                      setEditingPlayerStatsId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="spurs" onClick={() => {
                setShowPlayerStatsModal(false);
                setEditingPlayerStatsId(null);
                setPlayerStatsFormError(null);
                setNewPlayerStatsForm({
                  player_id: '',
                  match_id: '',
                  team_id: 1,
                  started: false,
                  captain: false,
                  was_substitute: false,
                  was_unused_substitute: false,
                  minute_on: null,
                  minute_off: null,
                  minutes_played: 0,
                  goals: 0,
                  assists: 0,
                  yellow_cards: 0,
                  red_cards: 0,
                  clean_sheet: null,
                  saves: null,
                  shots: 0,
                  shots_on_target: 0,
                  passes_completed: null,
                  passes_attempted: null,
                  tackles: null,
                  interceptions: null,
                  clearances: null,
                  fouls_committed: null,
                  fouls_won: null,
                  offsides: null,
                  player_rating: null,
                  player_of_the_match: false,
                });
              }}>
                Cancel
              </Button>
              <Button
                variant="spurs"
                onClick={async () => {
                  if (!newPlayerStatsForm.player_id || !newPlayerStatsForm.match_id) {
                    setPlayerStatsFormError('Player and Match are both required');
                    return;
                  }
                  try {
                    setLoading(true);
                    setPlayerStatsFormError(null);
                    // Determine was_substitute and was_unused_substitute based on started and minute_on
                    const wasSubstitute = !newPlayerStatsForm.started && newPlayerStatsForm.minute_on !== null;
                    const wasUnusedSubstitute = !newPlayerStatsForm.started && newPlayerStatsForm.minute_on === null;

                    const payload = {
                      ...newPlayerStatsForm,
                      was_substitute: wasSubstitute,
                      was_unused_substitute: wasUnusedSubstitute,
                    };

                    const response = editingPlayerStatsId
                      ? await callAdminApi('player-stats', 'PUT', { id: editingPlayerStatsId, ...payload })
                      : await callAdminApi('player-stats', 'POST', payload);
                    if (response.error) {
                      setPlayerStatsFormError(response.error);
                    } else {
                      showMessage(editingPlayerStatsId ? 'Player stats updated successfully' : 'Player stats created successfully', 'success');
                      setShowPlayerStatsModal(false);
                      setEditingPlayerStatsId(null);
                      setNewPlayerStatsForm({
                        player_id: '',
                        match_id: '',
                        team_id: 1,
                        started: false,
                        captain: false,
                        was_substitute: false,
                        was_unused_substitute: false,
                        minute_on: null,
                        minute_off: null,
                        minutes_played: 0,
                        goals: 0,
                        assists: 0,
                        yellow_cards: 0,
                        red_cards: 0,
                        clean_sheet: null,
                        saves: null,
                        shots: 0,
                        shots_on_target: 0,
                        passes_completed: null,
                        passes_attempted: null,
                        tackles: null,
                        interceptions: null,
                        clearances: null,
                        fouls_committed: null,
                        fouls_won: null,
                        offsides: null,
                        player_rating: null,
                        player_of_the_match: false,
                      });
                      // Reload player stats to update related records based on context
                      const playerStatsRes = await callAdminApi('player-stats', 'GET');
                      if (playerStatsRes.data) {
                        const allPlayerStats = playerStatsRes.data as PlayerStats[];
                        if (playerStatsContext === 'match' && editingMatchId) {
                          setRelatedPlayerStats(allPlayerStats.filter(ps => ps.match_id === editingMatchId));
                        } else if (playerStatsContext === 'player' && editingPlayerId) {
                          setRelatedPlayerStatsForPlayer(allPlayerStats.filter(ps => ps.player_id === editingPlayerId));
                        }
                      }
                    }
                  } catch (error) {
                    setPlayerStatsFormError(editingPlayerStatsId ? 'Error updating player stats' : 'Error creating player stats');
                    console.error('Error saving player stats:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {editingPlayerStatsId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Player History Modal */}
      {showPlayerHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingPlayerHistoryId ? 'Edit Player History' : 'Add Player History'}
            </h3>
            {playerHistoryFormError && (
              <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
                {playerHistoryFormError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
                <select
                  value={playerHistoryForm.team_id}
                  onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, team_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Joined On</label>
                <input
                  type="date"
                  value={playerHistoryForm.joined_on || ''}
                  onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, joined_on: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Left On</label>
                <input
                  type="date"
                  value={playerHistoryForm.left_on || ''}
                  onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, left_on: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Squad Number</label>
                <input
                  type="number"
                  value={playerHistoryForm.squad_number || ''}
                  onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, squad_number: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              {editingPlayerHistoryId && (
                <Button
                  variant="spurs"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this player history record?')) {
                      handleDeletePlayerHistory(editingPlayerHistoryId);
                      setShowPlayerHistoryModal(false);
                      setEditingPlayerHistoryId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="spurs" onClick={() => {
                setShowPlayerHistoryModal(false);
                setEditingPlayerHistoryId(null);
                setPlayerHistoryFormError(null);
                setPlayerHistoryForm({
                  player_id: '',
                  team_id: 1,
                  joined_on: '',
                  left_on: '',
                  squad_number: null,
                });
              }}>
                Cancel
              </Button>
              <Button
                variant="spurs"
                onClick={async () => {
                  if (!playerHistoryForm.joined_on) {
                    setPlayerHistoryFormError('Joined On is required');
                    return;
                  }
                  try {
                    setLoading(true);
                    setPlayerHistoryFormError(null);
                    // Convert empty string to null for the optional date field
                    const payload = {
                      ...playerHistoryForm,
                      left_on: playerHistoryForm.left_on || null,
                    };
                    const response = editingPlayerHistoryId
                      ? await callAdminApi('player-history', 'PUT', { id: editingPlayerHistoryId, ...payload })
                      : await callAdminApi('player-history', 'POST', payload);
                    if (response.error) {
                      setPlayerHistoryFormError(response.error);
                    } else {
                      showMessage(editingPlayerHistoryId ? 'Player history updated successfully' : 'Player history created successfully', 'success');
                      setShowPlayerHistoryModal(false);
                      setEditingPlayerHistoryId(null);
                      setPlayerHistoryForm({
                        player_id: '',
                        team_id: 1,
                        joined_on: '',
                        left_on: '',
                        squad_number: null,
                      });
                      // Reload player history to update related records
                      const playerHistoryRes = await callAdminApi('player-history', 'GET');
                      if (playerHistoryRes.data) {
                        const allPlayerHistory = playerHistoryRes.data as PlayerHistory[];
                        setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === editingPlayerId));
                      }
                    }
                  } catch (error) {
                    setPlayerHistoryFormError(editingPlayerHistoryId ? 'Error updating player history' : 'Error creating player history');
                    console.error('Error saving player history:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {editingPlayerHistoryId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stadium Name Modal */}
      {showStadiumNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingStadiumNameId ? 'Edit Stadium Name' : 'Add Stadium Name'}
            </h3>
            {stadiumNameFormError && (
              <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
                {stadiumNameFormError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={stadiumNameForm.name}
                  onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Valid From</label>
                <input
                  type="date"
                  value={stadiumNameForm.valid_from || ''}
                  onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, valid_from: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Valid To</label>
                <input
                  type="date"
                  value={stadiumNameForm.valid_to || ''}
                  onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, valid_to: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              {editingStadiumNameId && (
                <Button
                  variant="spurs"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this stadium name?')) {
                      handleDeleteStadiumName(editingStadiumNameId);
                      setShowStadiumNameModal(false);
                      setEditingStadiumNameId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="spurs" onClick={() => {
                setShowStadiumNameModal(false);
                setEditingStadiumNameId(null);
                setStadiumNameFormError(null);
                setStadiumNameForm({
                  stadium_id: '',
                  name: '',
                  valid_from: '',
                  valid_to: null,
                });
              }}>
                Cancel
              </Button>
              <Button
                variant="spurs"
                onClick={async () => {
                  if (!stadiumNameForm.valid_from) {
                    setStadiumNameFormError('Valid From is required');
                    return;
                  }
                  try {
                    setLoading(true);
                    setStadiumNameFormError(null);
                    // Convert empty string to null for the optional date field
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
                      setShowStadiumNameModal(false);
                      setEditingStadiumNameId(null);
                      setStadiumNameForm({
                        stadium_id: '',
                        name: '',
                        valid_from: '',
                        valid_to: null,
                      });
                      // Reload stadium names to update related records
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
                }}
              >
                {editingStadiumNameId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
