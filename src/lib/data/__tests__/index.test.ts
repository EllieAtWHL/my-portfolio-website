import { describe, it, expect } from '@jest/globals';
import * as dataModule from '../index';

// This file is a pure barrel (re-exports only, no logic of its own), so we just
// assert the public surface it's expected to expose actually comes through -
// this catches an accidentally-deleted or renamed `export * from './x'` line.
describe('data/index barrel', () => {
  it('re-exports the matches data-access functions', () => {
    expect(typeof dataModule.getUpcomingMatches).toBe('function');
    expect(typeof dataModule.getPreviousMatches).toBe('function');
    expect(typeof dataModule.getAllMatches).toBe('function');
    expect(typeof dataModule.getSeasonMatches).toBe('function');
    expect(typeof dataModule.getMatchById).toBe('function');
    expect(typeof dataModule.getAdjacentMatches).toBe('function');
    expect(typeof dataModule.getHomePageMatches).toBe('function');
    expect(typeof dataModule.getMatchesWithFilter).toBe('function');
    expect(typeof dataModule.getMatchesBySeason).toBe('function');
  });

  it('re-exports the cache-server functions', () => {
    expect(typeof dataModule.revalidateCacheTag).toBe('function');
    expect(typeof dataModule.revalidateCacheTags).toBe('function');
    expect(typeof dataModule.revalidateAllCache).toBe('function');
  });

  it('re-exports the cache-invalidation functions', () => {
    expect(typeof dataModule.invalidateMatchCache).toBe('function');
    expect(typeof dataModule.invalidateSeasonCache).toBe('function');
    expect(typeof dataModule.invalidateMediaCache).toBe('function');
    expect(typeof dataModule.invalidateNewsCache).toBe('function');
    expect(typeof dataModule.invalidateVideoCache).toBe('function');
    expect(typeof dataModule.invalidateAllRelatedCaches).toBe('function');
    expect(typeof dataModule.invalidateCacheByEntityType).toBe('function');
  });

  it('re-exports the cache-utils constants', () => {
    expect(dataModule.CACHE_TAGS).toBeDefined();
    expect(dataModule.CACHE_TAGS.MATCHES).toBe('matches');
    expect(dataModule.CACHE_TTL).toBeDefined();
    expect(typeof dataModule.CacheError).toBe('function');
  });

  it('re-exports entity modules (news, seasons, stadiums, teams, rss)', () => {
    expect(typeof dataModule.getSpursWomenNews).toBe('function');
    expect(typeof dataModule.getSeasons).toBe('function');
    expect(typeof dataModule.getStadiumBySlug).toBe('function');
    expect(typeof dataModule.getAllTeams).toBe('function');
    expect(typeof dataModule.fetchSpursWomenNews).toBe('function');
  });
});
