export interface Team {
  id: number;
  name: string;
  short_name: string;
  is_tottenham: boolean;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface Competition {
  id: string;
  name: string;
  type: string;
  nickname: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Match {
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

export interface Media {
  id: string;
  match_id: string;
  type: 'photo' | 'photo album' | 'article' | 'social media' | 'video-external';
  title: string | null;
  url: string;
  caption: string | null;
  sort_order: number;
}

export interface Player {
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
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
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

export interface PlayerHistory {
  id: string;
  player_id: string;
  team_id: number;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
}

export interface Stadium {
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

export interface StadiumName {
  id: string;
  stadium_id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
}
