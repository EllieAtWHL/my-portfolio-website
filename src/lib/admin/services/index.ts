// Admin write services (WEB-83): one validated code path for every admin
// write, shared by the /api/admin/* route handlers and the admin MCP write
// tools (WEB-251). Server-only - they use the service-role client, which
// bypasses RLS, so never import this from a client component or from the
// public MCP server's read tools.
export { createMatch, updateMatch, deleteMatch, matchFields } from './matches';
export { createPlayer, updatePlayer, deletePlayer, playerFields, PLAYER_POSITIONS } from './players';
export { createTeam, updateTeam, deleteTeam, teamFields } from './teams';
export { createStadium, updateStadium, deleteStadium, stadiumFields } from './stadia';
export { createStadiumName, updateStadiumName, deleteStadiumName, stadiumNameFields } from './stadium-names';
export { createMedia, updateMedia, deleteMedia, mediaFields, MEDIA_TYPES } from './media';
export { createPlayerHistory, updatePlayerHistory, deletePlayerHistory, playerHistoryFields } from './player-history';
export { createPlayerStats, updatePlayerStats, deletePlayerStats, playerStatsFields } from './player-stats';
export { AdminServiceError } from './errors';
export type { ServiceResult } from './crud';
