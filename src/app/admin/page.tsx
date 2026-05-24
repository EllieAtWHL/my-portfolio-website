'use client';

import { useState, useEffect, useCallback } from 'react';
import { callAdminApi, createEntityAndReload } from '@/lib/api-client';
import { getTeamColor } from '@/lib/utils/team-colors';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { MatchForm } from '@/components/admin/MatchForm';
import { MediaForm } from '@/components/admin/MediaForm';
import { TeamForm } from '@/components/admin/TeamForm';
import { PlayerForm } from '@/components/admin/PlayerForm';
import { PlayerStatsForm } from '@/components/admin/PlayerStatsForm';
import { PlayerHistoryForm } from '@/components/admin/PlayerHistoryForm';
import { StadiumForm } from '@/components/admin/StadiumForm';
import { StadiumNameForm } from '@/components/admin/StadiumNameForm';

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
  const [media, setMedia] = useState<Media[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [stadiumNames, setStadiumNames] = useState<StadiumName[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Recent records for each entity type
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
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

  // Media-specific pagination state
  const [mediaCurrentPage, setMediaCurrentPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const mediaPerPage = 20;

  // Teams-specific pagination state
  const [teamsCurrentPage, setTeamsCurrentPage] = useState(1);
  const [teamsTotalPages, setTeamsTotalPages] = useState(1);
  const teamsPerPage = 20;

  // Players-specific pagination state
  const [playersCurrentPage, setPlayersCurrentPage] = useState(1);
  const [playersTotalPages, setPlayersTotalPages] = useState(1);
  const playersPerPage = 20;

  // Player stats-specific pagination state
  const [playerStatsCurrentPage, setPlayerStatsCurrentPage] = useState(1);
  const [playerStatsTotalPages, setPlayerStatsTotalPages] = useState(1);
  const playerStatsPerPage = 20;

  // Player history-specific pagination state
  const [playerHistoryCurrentPage, setPlayerHistoryCurrentPage] = useState(1);
  const [playerHistoryTotalPages, setPlayerHistoryTotalPages] = useState(1);
  const playerHistoryPerPage = 20;

  // Stadiums-specific pagination state
  const [stadiumsCurrentPage, setStadiumsCurrentPage] = useState(1);
  const [stadiumsTotalPages, setStadiumsTotalPages] = useState(1);
  const stadiumsPerPage = 20;

  // Stadium names-specific pagination state
  const [stadiumNamesCurrentPage, setStadiumNamesCurrentPage] = useState(1);
  const [stadiumNamesTotalPages, setStadiumNamesTotalPages] = useState(1);
  const stadiumNamesPerPage = 20;

  // Search state for matches
  const [matchSearch, setMatchSearch] = useState('');

  // Search state for media
  const [mediaSearch, setMediaSearch] = useState('');

  // Search state for teams
  const [teamSearch, setTeamSearch] = useState('');

  // Search state for players
  const [playerSearch, setPlayerSearch] = useState('');

  // Search state for player stats
  const [playerStatsSearch, setPlayerStatsSearch] = useState('');

  // Search state for player history
  const [playerHistorySearch, setPlayerHistorySearch] = useState('');

  // Search state for stadiums
  const [stadiumSearch, setStadiumSearch] = useState('');

  // Search state for stadium names
  const [stadiumNameSearch, setStadiumNameSearch] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isMediaEditMode, setIsMediaEditMode] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [isTeamEditMode, setIsTeamEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [isPlayerEditMode, setIsPlayerEditMode] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [isPlayerStatsEditMode, setIsPlayerStatsEditMode] = useState(false);
  const [editingPlayerStatsId, setEditingPlayerStatsId] = useState<string | null>(null);
  const [editingPlayerStats, setEditingPlayerStats] = useState<PlayerStats | null>(null);
  const [isPlayerHistoryEditMode, setIsPlayerHistoryEditMode] = useState(false);
  const [editingPlayerHistoryId, setEditingPlayerHistoryId] = useState<string | null>(null);
  const [isStadiumEditMode, setIsStadiumEditMode] = useState(false);
  const [editingStadiumId, setEditingStadiumId] = useState<string | null>(null);
  const [isStadiumNameEditMode, setIsStadiumNameEditMode] = useState(false);
  const [editingStadiumNameId, setEditingStadiumNameId] = useState<string | null>(null);

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
        const [matchesRes, teamsRes, competitionsRes, seasonsRes, playersRes, stadiumsRes, stadiumNamesRes, mediaRes] = await Promise.all([
          callAdminApi('matches', 'GET'),
          callAdminApi('teams', 'GET'),
          callAdminApi('competitions', 'GET'),
          callAdminApi('seasons', 'GET'),
          callAdminApi('players', 'GET'),
          callAdminApi('stadia', 'GET'),
          callAdminApi('stadium-names', 'GET'),
          callAdminApi('media', 'GET'),
        ]);

        if (teamsRes.data) setTeams(teamsRes.data);
        if (competitionsRes.data) setCompetitions(competitionsRes.data);
        if (seasonsRes.data) setSeasons(seasonsRes.data);
        if (matchesRes.data) setMatches(matchesRes.data);
        if (mediaRes.data) setMedia(mediaRes.data);
        if (stadiumsRes.data) {
          setStadiums(stadiumsRes.data);
        } else {
          console.warn('No stadiums data');
        }
        if (stadiumNamesRes.data) setStadiumNames(stadiumNamesRes.data);
        if (playersRes.data) {
          setPlayers(playersRes.data);
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
    fetchRecentRecords();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Functions to fetch recent records for each entity type
  const fetchRecentRecords = useCallback(async (page: number = 1) => {
    try {

      // Determine which table to fetch based on active tab
      let tableName = '';
      
      switch (activeTab) {
        case 'media':
          tableName = 'media';
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
          tableName = 'stadia';
          break;
        case 'stadium_names':
          tableName = 'stadium_names';
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
          'player_stats': 'player-stats',
          'player_history': 'player-history',
          'stadium_names': 'stadium-names',
          'stadia': 'stadia',
        };
        const apiEndpoint = apiEndpointMap[tableName] || tableName;
        const dataRes = await callAdminApi(apiEndpoint, 'GET');

        // Set the appropriate state based on the active tab (store ALL data, not paginated)
        if (dataRes.data) {
          switch (activeTab) {
            case 'media':
              setRecentMedia(dataRes.data as Media[]);
              break;
            case 'player_stats':
              setRecentPlayerStats(dataRes.data as PlayerStats[]);
              break;
            case 'player_history':
              setRecentPlayerHistory(dataRes.data as PlayerHistory[]);
              break;
            case 'stadiums':
              setRecentStadiums(dataRes.data as Stadium[]);
              break;
            case 'stadium_names':
              setRecentStadiumNames(dataRes.data as StadiumName[]);
              break;
          }
        } else {
          switch (activeTab) {
            case 'media':
              setRecentMedia([]);
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
  }, [activeTab, recordsPerPage, setRecentMedia, setRecentPlayerStats, setRecentPlayerHistory, setRecentStadiums, setRecentStadiumNames, setTotalCount, setTotalPages]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setMatchesCurrentPage(1);
    setMatchesTotalPages(1);
    setMediaCurrentPage(1);
    setMediaTotalPages(1);
    setTeamsCurrentPage(1);
    setTeamsTotalPages(1);
    setPlayersCurrentPage(1);
    setPlayersTotalPages(1);
    setPlayerStatsCurrentPage(1);
    setPlayerStatsTotalPages(1);
    setPlayerHistoryCurrentPage(1);
    setPlayerHistoryTotalPages(1);
    setStadiumsCurrentPage(1);
    setStadiumsTotalPages(1);
    setStadiumNamesCurrentPage(1);
    setStadiumNamesTotalPages(1);
    fetchRecentRecords(1);
    
    // Reset edit modes when switching tabs
    if (activeTab !== 'matches') {
      setIsEditMode(false);
      setEditingMatchId(null);
    }
    if (activeTab !== 'media') {
      setIsMediaEditMode(false);
      setEditingMediaId(null);
    }
    if (activeTab !== 'teams') {
      setIsTeamEditMode(false);
      setEditingTeamId(null);
    }
    if (activeTab !== 'players') {
      setIsPlayerEditMode(false);
      setEditingPlayerId(null);
    }
    if (activeTab !== 'player_stats') {
      setIsPlayerStatsEditMode(false);
      setEditingPlayerStatsId(null);
    }
    if (activeTab !== 'player_history') {
      setIsPlayerHistoryEditMode(false);
      setEditingPlayerHistoryId(null);
    }
    if (activeTab !== 'stadiums') {
      setIsStadiumEditMode(false);
      setEditingStadiumId(null);
    }
    if (activeTab !== 'stadium_names') {
      setIsStadiumNameEditMode(false);
      setEditingStadiumNameId(null);
    }
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

  // Helper function for filtering media (searches across ALL media)
  const getFilteredMedia = useCallback(() => {
    return media.filter(mediaItem => {
      if (!mediaSearch) return true;
      const searchTerm = mediaSearch.toLowerCase();
      const match = matches.find(m => m.id === mediaItem.match_id);
      const homeTeam = teams.find(t => t.id === match?.home_team_id);
      const awayTeam = teams.find(t => t.id === match?.away_team_id);
      const matchDescription = match && homeTeam && awayTeam
        ? `${homeTeam.short_name} vs ${awayTeam.short_name} (${match.date})`
        : '';
      return (
        mediaItem.type?.toLowerCase().includes(searchTerm) ||
        mediaItem.title?.toLowerCase().includes(searchTerm) ||
        mediaItem.url?.toLowerCase().includes(searchTerm) ||
        matchDescription.toLowerCase().includes(searchTerm)
      );
    });
  }, [media, matches, teams, mediaSearch]);

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

  // Helper function for filtering player stats (searches across ALL player stats)
  const getFilteredPlayerStats = useCallback(() => {
    return recentPlayerStats.filter(stat => {
      if (!playerStatsSearch) return true;
      const searchTerm = playerStatsSearch.toLowerCase();
      const player = players.find(p => p.id === stat.player_id);
      const match = matches.find(m => m.id === stat.match_id);
      const homeTeam = teams.find(t => t.id === match?.home_team_id);
      const awayTeam = teams.find(t => t.id === match?.away_team_id);
      const playerName = player ? `${player.first_name} ${player.last_name}` : '';
      const matchDescription = match && homeTeam && awayTeam
        ? `${homeTeam.short_name} vs ${awayTeam.short_name} (${match.date})`
        : match?.date || '';
      return (
        playerName.toLowerCase().includes(searchTerm) ||
        matchDescription.toLowerCase().includes(searchTerm) ||
        stat.goals.toString().includes(searchTerm) ||
        stat.assists.toString().includes(searchTerm)
      );
    });
  }, [recentPlayerStats, players, matches, teams, playerStatsSearch]);

  // Helper function for filtering player history (searches across ALL player history)
  const getFilteredPlayerHistory = useCallback(() => {
    return recentPlayerHistory.filter(history => {
      if (!playerHistorySearch) return true;
      const searchTerm = playerHistorySearch.toLowerCase();
      const player = players.find(p => p.id === history.player_id);
      const team = teams.find(t => t.id === history.team_id);
      const playerName = player ? `${player.first_name} ${player.last_name}` : '';
      const teamName = team?.name || '';
      return (
        playerName.toLowerCase().includes(searchTerm) ||
        teamName.toLowerCase().includes(searchTerm) ||
        history.squad_number?.toString().includes(searchTerm) ||
        history.joined_on?.includes(searchTerm) ||
        history.left_on?.includes(searchTerm)
      );
    });
  }, [recentPlayerHistory, players, teams, playerHistorySearch]);

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

  // Helper function for filtering stadium names (searches across ALL stadium names)
  const getFilteredStadiumNames = useCallback(() => {
    return recentStadiumNames.filter(stadiumName => {
      if (!stadiumNameSearch) return true;
      const searchTerm = stadiumNameSearch.toLowerCase();
      const stadium = stadiums.find(s => s.id === stadiumName.stadium_id);
      return (
        stadiumName.name?.toLowerCase().includes(searchTerm) ||
        stadium?.name?.toLowerCase().includes(searchTerm) ||
        stadiumName.valid_from?.includes(searchTerm) ||
        stadiumName.valid_to?.includes(searchTerm)
      );
    });
  }, [recentStadiumNames, stadiums, stadiumNameSearch]);

  // Get paginated matches (applies pagination to filtered results)
  const getPaginatedMatches = () => {
    const filtered = getFilteredMatches();
    const startIndex = (matchesCurrentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated media (applies pagination to filtered results)
  const getPaginatedMedia = () => {
    const filtered = getFilteredMedia();
    const startIndex = (mediaCurrentPage - 1) * mediaPerPage;
    const endIndex = startIndex + mediaPerPage;
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

  // Get paginated player stats (applies pagination to filtered results)
  const getPaginatedPlayerStats = () => {
    const filtered = getFilteredPlayerStats();
    const startIndex = (playerStatsCurrentPage - 1) * playerStatsPerPage;
    const endIndex = startIndex + playerStatsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated player history (applies pagination to filtered results)
  const getPaginatedPlayerHistory = () => {
    const filtered = getFilteredPlayerHistory();
    const startIndex = (playerHistoryCurrentPage - 1) * playerHistoryPerPage;
    const endIndex = startIndex + playerHistoryPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated stadiums (applies pagination to filtered results)
  const getPaginatedStadiums = () => {
    const filtered = getFilteredStadiums();
    const startIndex = (stadiumsCurrentPage - 1) * stadiumsPerPage;
    const endIndex = startIndex + stadiumsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get paginated stadium names (applies pagination to filtered results)
  const getPaginatedStadiumNames = () => {
    const filtered = getFilteredStadiumNames();
    const startIndex = (stadiumNamesCurrentPage - 1) * stadiumNamesPerPage;
    const endIndex = startIndex + stadiumNamesPerPage;
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

  // Update media pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredMedia();
    const newTotalPages = Math.ceil(filtered.length / mediaPerPage);
    setMediaTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (mediaCurrentPage > newTotalPages && newTotalPages > 0) {
      setMediaCurrentPage(1);
    }
  }, [getFilteredMedia, mediaCurrentPage, mediaPerPage]);

  // Update teams pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredTeams();
    const newTotalPages = Math.ceil(filtered.length / teamsPerPage);
    setTeamsTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (teamsCurrentPage > newTotalPages && newTotalPages > 0) {
      setTeamsCurrentPage(1);
    }
  }, [getFilteredTeams, teamsCurrentPage, teamsPerPage]);

  // Update players pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredPlayers();
    const newTotalPages = Math.ceil(filtered.length / playersPerPage);
    setPlayersTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (playersCurrentPage > newTotalPages && newTotalPages > 0) {
      setPlayersCurrentPage(1);
    }
  }, [getFilteredPlayers, playersCurrentPage, playersPerPage]);

  // Update player stats pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredPlayerStats();
    const newTotalPages = Math.ceil(filtered.length / playerStatsPerPage);
    setPlayerStatsTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (playerStatsCurrentPage > newTotalPages && newTotalPages > 0) {
      setPlayerStatsCurrentPage(1);
    }
  }, [getFilteredPlayerStats, playerStatsCurrentPage, playerStatsPerPage]);

  // Update player history pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredPlayerHistory();
    const newTotalPages = Math.ceil(filtered.length / playerHistoryPerPage);
    setPlayerHistoryTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (playerHistoryCurrentPage > newTotalPages && newTotalPages > 0) {
      setPlayerHistoryCurrentPage(1);
    }
  }, [getFilteredPlayerHistory, playerHistoryCurrentPage, playerHistoryPerPage]);

  // Update stadiums pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredStadiums();
    const newTotalPages = Math.ceil(filtered.length / stadiumsPerPage);
    setStadiumsTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (stadiumsCurrentPage > newTotalPages && newTotalPages > 0) {
      setStadiumsCurrentPage(1);
    }
  }, [getFilteredStadiums, stadiumsCurrentPage, stadiumsPerPage]);

  // Update stadium names pagination when search or data changes
  useEffect(() => {
    const filtered = getFilteredStadiumNames();
    const newTotalPages = Math.ceil(filtered.length / stadiumNamesPerPage);
    setStadiumNamesTotalPages(newTotalPages);
    // Reset to page 1 if current page is beyond new total
    if (stadiumNamesCurrentPage > newTotalPages && newTotalPages > 0) {
      setStadiumNamesCurrentPage(1);
    }
  }, [getFilteredStadiumNames, stadiumNamesCurrentPage, stadiumNamesPerPage]);

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

  const handleEditMedia = (media: Media) => {
    setIsMediaEditMode(true);
    setEditingMediaId(media.id);
    setMediaForm({
      match_id: media.match_id,
      type: media.type,
      title: media.title || '',
      url: media.url,
      caption: media.caption || '',
      sort_order: media.sort_order,
    });
  };

  const handleCancelEditMedia = () => {
    setIsMediaEditMode(false);
    setEditingMediaId(null);
    setMediaForm({
      match_id: '',
      type: 'social media',
      title: '',
      url: '',
      caption: '',
      sort_order: 0,
    });
  };

  const handleDeleteMedia = async (mediaId: string) => {
    setLoading(true);
    try {
      await callAdminApi('media', 'DELETE', { id: mediaId });
      showMessage('Media deleted successfully', 'success');

      // Reload media data
      try {
        const mediaResponse = await callAdminApi('media', 'GET');
        if (mediaResponse.data) setMedia(mediaResponse.data);
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
        if (teamsResponse.data) setTeams(teamsResponse.data);
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
    setEditingTeamId(team.id);
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
        if (playersResponse.data) setPlayers(playersResponse.data);
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

  const handleEditPlayer = (player: Player) => {
    setIsPlayerEditMode(true);
    setEditingPlayerId(player.id);
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

      // Reload player stats data
      try {
        const playerStatsResponse = await callAdminApi('player-stats', 'GET');
        if (playerStatsResponse.data) setRecentPlayerStats(playerStatsResponse.data);
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

  const handleEditPlayerStats = (stat: PlayerStats) => {
    setIsPlayerStatsEditMode(true);
    setEditingPlayerStatsId(stat.id);
    setEditingPlayerStats(stat);
  };

  const handleCancelEditPlayerStats = () => {
    setIsPlayerStatsEditMode(false);
    setEditingPlayerStatsId(null);
    setEditingPlayerStats(null);
  };

  const handleDeletePlayerHistory = async (playerHistoryId: string) => {
    setLoading(true);
    try {
      await callAdminApi('player-history', 'DELETE', { id: playerHistoryId });
      showMessage('Player history deleted successfully', 'success');

      // Reload player history data
      try {
        const playerHistoryResponse = await callAdminApi('player-history', 'GET');
        if (playerHistoryResponse.data) setRecentPlayerHistory(playerHistoryResponse.data);
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

  const handleEditPlayerHistory = (history: PlayerHistory) => {
    setIsPlayerHistoryEditMode(true);
    setEditingPlayerHistoryId(history.id);
    setPlayerHistoryForm({
      player_id: history.player_id,
      team_id: history.team_id,
      joined_on: history.joined_on,
      left_on: history.left_on,
      squad_number: history.squad_number,
    });
  };

  const handleCancelEditPlayerHistory = () => {
    setIsPlayerHistoryEditMode(false);
    setEditingPlayerHistoryId(null);
    setPlayerHistoryForm({
      player_id: '',
      team_id: 1,
      joined_on: null,
      left_on: null,
      squad_number: null,
    });
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
          setStadiums(stadiumsResponse.data);
          setRecentStadiums(stadiumsResponse.data);
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

  const handleEditStadium = (stadium: Stadium) => {
    setIsStadiumEditMode(true);
    setEditingStadiumId(stadium.id);
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
          setStadiumNames(stadiumNamesResponse.data);
          setRecentStadiumNames(stadiumNamesResponse.data);
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

  const handleEditStadiumName = (stadiumName: StadiumName) => {
    setIsStadiumNameEditMode(true);
    setEditingStadiumNameId(stadiumName.id);
    setStadiumNameForm({
      stadium_id: stadiumName.stadium_id,
      name: stadiumName.name,
      valid_from: stadiumName.valid_from,
      valid_to: stadiumName.valid_to,
    });
  };

  const handleCancelEditStadiumName = () => {
    setIsStadiumNameEditMode(false);
    setEditingStadiumNameId(null);
    setStadiumNameForm({
      stadium_id: '',
      name: '',
      valid_from: null,
      valid_to: null,
    });
  };

  const handlePlayerHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        player_id: playerHistoryForm.player_id,
        team_id: playerHistoryForm.team_id,
        joined_on: playerHistoryForm.joined_on || null,
        left_on: playerHistoryForm.left_on || null,
        squad_number: playerHistoryForm.squad_number || null,
      };

      let response;
      if (isPlayerHistoryEditMode && editingPlayerHistoryId) {
        // Update existing player history
        response = await fetch('/api/admin/player-history', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingPlayerHistoryId, ...payload }),
        });
      } else {
        // Create new player history
        response = await fetch('/api/admin/player-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isPlayerHistoryEditMode ? 'update' : 'create'} player history`);
      }

      showMessage(isPlayerHistoryEditMode ? 'Player history updated successfully' : 'Player history created successfully', 'success');
      
      // Reset form and edit mode
      handleCancelEditPlayerHistory();
      
      // Reload player history data
      try {
        const playerHistoryResponse = await fetch('/api/admin/player-history');
        const playerHistoryResult = await playerHistoryResponse.json();
        if (playerHistoryResult.data) setRecentPlayerHistory(playerHistoryResult.data);
      } catch (error) {
        console.error('Error reloading player history:', error);
      }
    } catch (error) {
      console.error(`Error ${isPlayerHistoryEditMode ? 'updating' : 'creating'} player history:`, error);
      
      let errorMessage = isPlayerHistoryEditMode ? 'Error updating player history' : 'Error creating player history';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isPlayerHistoryEditMode ? 'Error updating player history' : 'Error creating player history'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isPlayerHistoryEditMode ? 'Error updating player history' : 'Error creating player history'}: ${error.code}`;
        } else {
          errorMessage = `${isPlayerHistoryEditMode ? 'Error updating player history' : 'Error creating player history'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isPlayerHistoryEditMode ? 'Error updating player history' : 'Error creating player history'}: ${error}`;
      }
      
      showMessage(errorMessage, 'error');
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
        if (teamsResult.data) setTeams(teamsResult.data);
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
        if (playersResult.data) setPlayers(playersResult.data);
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
      let response;
      if (isMediaEditMode && editingMediaId) {
        // Update existing media
        response = await fetch('/api/admin/media', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingMediaId, ...mediaForm }),
        });
      } else {
        // Create new media
        response = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mediaForm),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isMediaEditMode ? 'update' : 'create'} media`);
      }

      showMessage(isMediaEditMode ? 'Media updated successfully' : 'Media created successfully', 'success');
      
      // Reset form and edit mode
      handleCancelEditMedia();
      
      // Reload recent media records
      try {
        const mediaResponse = await fetch('/api/admin/media');
        const mediaResult = await mediaResponse.json();
        if (mediaResult.data) {
          setMedia(mediaResult.data);
        }
      } catch (error) {
        console.error('Error reloading recent media:', error);
      }
    } catch (error) {
      console.error(`Error ${isMediaEditMode ? 'updating' : 'creating'} media:`, error);
      
      let errorMessage = isMediaEditMode ? 'Error updating media' : 'Error creating media';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isMediaEditMode ? 'Error updating media' : 'Error creating media'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isMediaEditMode ? 'Error updating media' : 'Error creating media'}: ${error.code}`;
        } else {
          errorMessage = `${isMediaEditMode ? 'Error updating media' : 'Error creating media'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isMediaEditMode ? 'Error updating media' : 'Error creating media'}: ${error}`;
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
          <MatchForm
            matchForm={matchForm}
            setMatchForm={setMatchForm}
            seasons={seasons}
            competitions={competitions}
            teams={teams}
            stadiums={stadiums}
            stadiumNames={stadiumNames}
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

        {/* Media Form */}
        {activeTab === 'media' && (
          <MediaForm
            mediaForm={mediaForm}
            setMediaForm={setMediaForm}
            mediaSeason={mediaSeason}
            setMediaSeason={setMediaSeason}
            matches={matches}
            seasons={seasons}
            teams={teams}
            competitions={competitions}
            isMediaEditMode={isMediaEditMode}
            editingMediaId={editingMediaId}
            loading={loading}
            onSubmit={handleMediaSubmit}
            onDelete={() => {
              if (editingMediaId && confirm('Are you sure you want to delete this media?')) {
                handleDeleteMedia(editingMediaId);
              }
            }}
            onCancel={handleCancelEditMedia}
          />
        )}

        {/* Team Form */}
        {activeTab === 'teams' && (
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

        {/* Player Form */}
        {activeTab === 'players' && (
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

        {/* Stadium Form */}
        {activeTab === 'stadiums' && (
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
                    setStadiums(stadiumsRes.data);
                    setRecentStadiums(stadiumsRes.data);
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

        {/* Player Stats Form */}
        {activeTab === 'player_stats' && (
          <PlayerStatsForm
            playerStatsSeason={playerStatsSeason}
            setPlayerStatsSeason={setPlayerStatsSeason}
            players={players}
            matches={matches}
            teams={teams}
            seasons={seasons}
            isPlayerStatsEditMode={isPlayerStatsEditMode}
            editingPlayerStatsId={editingPlayerStatsId}
            editingPlayerStats={editingPlayerStats}
            loading={loading}
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const payload = {
                  player_id: formData.get('player_id') as string,
                  match_id: formData.get('match_id') as string,
                  team_id: parseInt(formData.get('team_id') as string),
                  started: formData.get('participation') === 'started',
                  captain: formData.get('captain') === 'true',
                  was_substitute: formData.get('participation') === 'substitute',
                  was_unused_substitute: formData.get('participation') === 'unused_substitute',
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

                let response;
                if (isPlayerStatsEditMode && editingPlayerStatsId) {
                  // Update existing player stats
                  response = await fetch('/api/admin/player-stats', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: editingPlayerStatsId, ...payload }),
                  });
                } else {
                  // Create new player stats
                  response = await fetch('/api/admin/player-stats', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                  });
                }

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || `Failed to ${isPlayerStatsEditMode ? 'update' : 'create'} player stats`);
                }

                showMessage(isPlayerStatsEditMode ? 'Player stats updated successfully' : 'Player stats created successfully', 'success');
                
                // Reset form and edit mode
                handleCancelEditPlayerStats();
                
                // Reload recent player stats records
                try {
                  const playerStatsRes = await callAdminApi('player-stats', 'GET');
                  if (playerStatsRes.data) setRecentPlayerStats(playerStatsRes.data);
                } catch (error) {
                  console.error('Error reloading recent player stats:', error);
                }
              } catch (error) {
                console.error(`Error ${isPlayerStatsEditMode ? 'updating' : 'creating'} player stats:`, error);
                
                let errorMessage = isPlayerStatsEditMode ? 'Error updating player stats' : 'Error creating player stats';
                if (error && typeof error === 'object') {
                  if ('message' in error) {
                    errorMessage = `${isPlayerStatsEditMode ? 'Error updating player stats' : 'Error creating player stats'}: ${error.message}`;
                  } else if ('code' in error) {
                    errorMessage = `${isPlayerStatsEditMode ? 'Error updating player stats' : 'Error creating player stats'}: ${error.code}`;
                  } else {
                    errorMessage = `${isPlayerStatsEditMode ? 'Error updating player stats' : 'Error creating player stats'}: ${JSON.stringify(error)}`;
                  }
                } else if (typeof error === 'string') {
                  errorMessage = `${isPlayerStatsEditMode ? 'Error updating player stats' : 'Error creating player stats'}: ${error}`;
                }
                
                showMessage(errorMessage, 'error');
              } finally {
                setLoading(false);
              }
            }}
            onDelete={() => {
              if (editingPlayerStatsId && confirm('Are you sure you want to delete this player stats record?')) {
                handleDeletePlayerStats(editingPlayerStatsId);
              }
            }}
            onCancel={handleCancelEditPlayerStats}
          />
        )}

        {/* Player History Form */}
        {activeTab === 'player_history' && (
          <PlayerHistoryForm
            players={players}
            teams={teams}
            loading={loading}
            playerHistoryForm={playerHistoryForm}
            setPlayerHistoryForm={setPlayerHistoryForm}
            isEditMode={isPlayerHistoryEditMode}
            onSubmit={handlePlayerHistorySubmit}
            onDelete={() => {
              if (editingPlayerHistoryId && confirm('Are you sure you want to delete this player history record?')) {
                handleDeletePlayerHistory(editingPlayerHistoryId);
              }
            }}
            onCancel={handleCancelEditPlayerHistory}
          />
        )}

        {/* Stadium Names Form */}
        {activeTab === 'stadium_names' && (
          <StadiumNameForm
            stadiums={stadiums}
            stadiumNameForm={stadiumNameForm}
            setStadiumNameForm={setStadiumNameForm}
            isStadiumNameEditMode={isStadiumNameEditMode}
            editingStadiumNameId={editingStadiumNameId}
            loading={loading}
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const payload = {
                  stadium_id: stadiumNameForm.stadium_id,
                  name: stadiumNameForm.name,
                  valid_from: stadiumNameForm.valid_from || null,
                  valid_to: stadiumNameForm.valid_to || null,
                };

                if (isStadiumNameEditMode && editingStadiumNameId) {
                  // Update existing stadium name
                  const response = await fetch('/api/admin/stadium-names', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: editingStadiumNameId, ...payload }),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to update stadium name');
                  }
                  showMessage('Stadium name updated successfully', 'success');
                } else {
                  // Create new stadium name
                  await createEntityAndReload('stadium-names', payload, 'stadium-names', () => {
                    // Stadium names don't need to reload a list, just show success
                  });
                }

                // Reload stadium names data
                try {
                  const stadiumNamesResponse = await callAdminApi('stadium-names', 'GET');
                  if (stadiumNamesResponse.data) {
                    setStadiumNames(stadiumNamesResponse.data);
                    setRecentStadiumNames(stadiumNamesResponse.data);
                  }
                } catch (error) {
                  console.error('Error reloading stadium names:', error);
                }

                // Reset form
                setStadiumNameForm({
                  stadium_id: '',
                  name: '',
                  valid_from: null,
                  valid_to: null,
                });
                setIsStadiumNameEditMode(false);
                setEditingStadiumNameId(null);
              } catch (error) {
                showMessage(isStadiumNameEditMode ? 'Error updating stadium name' : 'Error creating stadium name', 'error');
                console.error('Error with stadium name:', error);
              } finally {
                setLoading(false);
              }
            }}
            onDelete={async () => {
              if (editingStadiumNameId) {
                await handleDeleteStadiumName(editingStadiumNameId);
                setStadiumNameForm({
                  stadium_id: '',
                  name: '',
                  valid_from: null,
                  valid_to: null,
                });
                setIsStadiumNameEditMode(false);
                setEditingStadiumNameId(null);
              }
            }}
            onCancel={() => {
              handleCancelEditStadiumName();
            }}
          />
        )}

        {/* Recent Records Preview */}
        <div className="mt-8 spurs-accent-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold spurs-text">
              {activeTab === 'matches'
                ? (matchSearch ? `All Matches (${getFilteredMatches().length} filtered)` : 'All Matches')
                : activeTab === 'media' ? (mediaSearch ? `All Media (${getFilteredMedia().length} filtered)` : 'All Media') :
                activeTab === 'teams' ? (teamSearch ? `All Teams (${getFilteredTeams().length} filtered)` : 'All Teams') :
                activeTab === 'players' ? (playerSearch ? `All Players (${getFilteredPlayers().length} filtered)` : 'All Players') :
                activeTab === 'player_stats' ? (playerStatsSearch ? `All Player Stats (${getFilteredPlayerStats().length} filtered)` : 'All Player Stats') :
                activeTab === 'player_history' ? (playerHistorySearch ? `All Player History (${getFilteredPlayerHistory().length} filtered)` : 'All Player History') :
                activeTab === 'stadiums' ? (stadiumSearch ? `All Stadiums (${getFilteredStadiums().length} filtered)` : 'All Stadiums') :
                activeTab === 'stadium_names' ? (stadiumNameSearch ? `All Stadium Names (${getFilteredStadiumNames().length} filtered)` : 'All Stadium Names') :
                'Recent Records'}
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
          {activeTab === 'media' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search media by type, title, URL, or match..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
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
          {activeTab === 'player_stats' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search player stats by player name, match, goals, or assists..."
                value={playerStatsSearch}
                onChange={(e) => setPlayerStatsSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'player_history' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search player history by player name, team, squad number, or dates..."
                value={playerHistorySearch}
                onChange={(e) => setPlayerHistorySearch(e.target.value)}
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
          {activeTab === 'stadium_names' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search stadium names by name, stadium, or dates..."
                value={stadiumNameSearch}
                onChange={(e) => setStadiumNameSearch(e.target.value)}
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
                    {getPaginatedMedia().length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-gray-400">
                          No media records found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedMedia().map(mediaItem => {
                        const match = matches.find(m => m.id === mediaItem.match_id);
                        const homeTeam = teams.find(t => t.id === match?.home_team_id);
                        const awayTeam = teams.find(t => t.id === match?.away_team_id);

                        return (
                          <tr 
                            key={mediaItem.id} 
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditMedia(mediaItem)}
                          >
                            <td className="p-2 spurs-text">{mediaItem.type}</td>
                            <td className="p-2 spurs-text">
                              {match && homeTeam && awayTeam
                                ? `${homeTeam.short_name} vs ${awayTeam.short_name} (${match.date})`
                                : '-'
                              }
                            </td>
                            <td className="p-2 spurs-text max-w-xs truncate">{mediaItem.url}</td>
                          </tr>
                        );
                      })
                    )}
                  </>
                )}
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
                {activeTab === 'player_stats' && (
                  <>
                    {getPaginatedPlayerStats().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-gray-400">
                          No player stats found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedPlayerStats().map(stat => {
                        const player = players.find(p => p.id === stat.player_id);
                        const match = matches.find(m => m.id === stat.match_id);
                        const homeTeam = teams.find(t => t.id === match?.home_team_id);
                        const awayTeam = teams.find(t => t.id === match?.away_team_id);
                        return (
                          <tr 
                            key={stat.id} 
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditPlayerStats(stat)}
                          >
                            <td className="p-2 spurs-text">{player?.first_name ? `${player.first_name} ` : ''}{player?.last_name}</td>
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
                      })
                    )}
                  </>
                )}
                {activeTab === 'player_history' && (
                  <>
                    {getPaginatedPlayerHistory().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-gray-400">
                          No player history found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedPlayerHistory().map(history => {
                        const player = players.find(p => p.id === history.player_id);
                        const team = teams.find(t => t.id === history.team_id);
                        return (
                          <tr 
                            key={history.id} 
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditPlayerHistory(history)}
                          >
                            <td className="p-2 spurs-text">
                              {player ? `${player.first_name ? `${player.first_name} ` : ''}${player.last_name}` : `Player ID: ${history.player_id} (not found)`}
                            </td>
                            <td className="p-2 spurs-text">{team?.name || 'Unknown Team'}</td>
                            <td className="p-2 spurs-text">{history.squad_number || '-'}</td>
                            <td className="p-2 spurs-text">{history.joined_on || '-'}</td>
                            <td className="p-2 spurs-text">{history.left_on || '-'}</td>
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
                {activeTab === 'stadium_names' && (
                  <>
                    {getPaginatedStadiumNames().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-gray-400">
                          No stadium names found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedStadiumNames().map(stadiumName => {
                        const stadium = stadiums.find(s => s.id === stadiumName.stadium_id);
                        return (
                          <tr
                            key={stadiumName.id}
                            className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => handleEditStadiumName(stadiumName)}
                          >
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
          {activeTab === 'media' && mediaTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((mediaCurrentPage - 1) * mediaPerPage) + 1} to {Math.min(mediaCurrentPage * mediaPerPage, getFilteredMedia().length)} of {getFilteredMedia().length} media
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setMediaCurrentPage(mediaCurrentPage - 1)}
                  disabled={mediaCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {mediaCurrentPage} of {mediaTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setMediaCurrentPage(mediaCurrentPage + 1)}
                  disabled={mediaCurrentPage === mediaTotalPages}
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
          {activeTab === 'player_stats' && playerStatsTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((playerStatsCurrentPage - 1) * playerStatsPerPage) + 1} to {Math.min(playerStatsCurrentPage * playerStatsPerPage, getFilteredPlayerStats().length)} of {getFilteredPlayerStats().length} player stats
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayerStatsCurrentPage(playerStatsCurrentPage - 1)}
                  disabled={playerStatsCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {playerStatsCurrentPage} of {playerStatsTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayerStatsCurrentPage(playerStatsCurrentPage + 1)}
                  disabled={playerStatsCurrentPage === playerStatsTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'player_history' && playerHistoryTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((playerHistoryCurrentPage - 1) * playerHistoryPerPage) + 1} to {Math.min(playerHistoryCurrentPage * playerHistoryPerPage, getFilteredPlayerHistory().length)} of {getFilteredPlayerHistory().length} player history
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayerHistoryCurrentPage(playerHistoryCurrentPage - 1)}
                  disabled={playerHistoryCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {playerHistoryCurrentPage} of {playerHistoryTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setPlayerHistoryCurrentPage(playerHistoryCurrentPage + 1)}
                  disabled={playerHistoryCurrentPage === playerHistoryTotalPages}
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
          {activeTab === 'stadium_names' && stadiumNamesTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((stadiumNamesCurrentPage - 1) * stadiumNamesPerPage) + 1} to {Math.min(stadiumNamesCurrentPage * stadiumNamesPerPage, getFilteredStadiumNames().length)} of {getFilteredStadiumNames().length} stadium names
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setStadiumNamesCurrentPage(stadiumNamesCurrentPage - 1)}
                  disabled={stadiumNamesCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {stadiumNamesCurrentPage} of {stadiumNamesTotalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => setStadiumNamesCurrentPage(stadiumNamesCurrentPage + 1)}
                  disabled={stadiumNamesCurrentPage === stadiumNamesTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {activeTab !== 'matches' && activeTab !== 'media' && activeTab !== 'stadium_names' && activeTab !== 'stadiums' && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalCount)} of {totalCount} records
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="spurs"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
