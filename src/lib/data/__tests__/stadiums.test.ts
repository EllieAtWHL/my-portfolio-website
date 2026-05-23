import { describe, it, expect } from '@jest/globals';

// Basic test to verify the modules can be imported
describe('Stadium Data Module', () => {
  it('should import stadium functions successfully', async () => {
    const { getStadiumBySlug, getStadiumNames, getMatchesAtStadium } = await import('@/lib/data/stadiums');
    
    expect(typeof getStadiumBySlug).toBe('function');
    expect(typeof getStadiumNames).toBe('function');
    expect(typeof getMatchesAtStadium).toBe('function');
  });

  it('should import stadium types successfully', async () => {
    const stadiumsModule = await import('@/lib/data/stadiums');
    
    expect(stadiumsModule).toBeDefined();
    // The types are exported but may not be available as runtime values
    expect(typeof stadiumsModule).toBe('object');
  });

  describe('invalidateStadiumCache', () => {
    it('should be a function', async () => {
      const { invalidateStadiumCache } = await import('@/lib/data/stadiums');
      expect(typeof invalidateStadiumCache).toBe('function');
    });

    it('should resolve without arguments', async () => {
      const { invalidateStadiumCache } = await import('@/lib/data/stadiums');
      await expect(invalidateStadiumCache()).resolves.not.toThrow();
    });

    it('should resolve with stadiumId', async () => {
      const { invalidateStadiumCache } = await import('@/lib/data/stadiums');
      await expect(invalidateStadiumCache('stadium-123')).resolves.not.toThrow();
    });

    it('should resolve with stadiumSlug', async () => {
      const { invalidateStadiumCache } = await import('@/lib/data/stadiums');
      await expect(invalidateStadiumCache(undefined, 'tottenham-hotspur-stadium')).resolves.not.toThrow();
    });

    it('should resolve with both stadiumId and stadiumSlug', async () => {
      const { invalidateStadiumCache } = await import('@/lib/data/stadiums');
      await expect(invalidateStadiumCache('stadium-123', 'tottenham-hotspur-stadium')).resolves.not.toThrow();
    });
  });

  describe('invalidateAllStadiumCaches', () => {
    it('should be a function', async () => {
      const { invalidateAllStadiumCaches } = await import('@/lib/data/stadiums');
      expect(typeof invalidateAllStadiumCaches).toBe('function');
    });

    it('should resolve without arguments', async () => {
      const { invalidateAllStadiumCaches } = await import('@/lib/data/stadiums');
      await expect(invalidateAllStadiumCaches()).resolves.not.toThrow();
    });
  });

  describe('getAllStadiums', () => {
    it('should be a function', async () => {
      const { getAllStadiums } = await import('@/lib/data/stadiums');
      expect(typeof getAllStadiums).toBe('function');
    });
  });
});
