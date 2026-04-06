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
});
