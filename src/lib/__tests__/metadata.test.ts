import { generatePageMetadata, generateDefaultMetadata } from '../metadata';

describe('generatePageMetadata', () => {
  it('returns the title (as absolute, so the root template is skipped) and description', () => {
    expect(generatePageMetadata('Home', 'Welcome to the site')).toEqual({
      title: { absolute: 'Home' },
      description: 'Welcome to the site',
    });
  });
});

describe('generateDefaultMetadata', () => {
  it('builds a title suffixed with the club name', () => {
    const metadata = generateDefaultMetadata('Fixtures');
    expect(metadata.title).toEqual({ absolute: 'Fixtures - Tottenham Hotspur Women' });
  });

  it('builds a lowercased description sentence from the page name', () => {
    const metadata = generateDefaultMetadata('Fixtures');
    expect(metadata.description).toBe('Browse fixtures for Tottenham Hotspur Women FC');
  });

  it('lowercases a mixed-case page name in the description but preserves case in the title', () => {
    const metadata = generateDefaultMetadata('Player Stats');
    expect(metadata.title).toEqual({ absolute: 'Player Stats - Tottenham Hotspur Women' });
    expect(metadata.description).toBe('Browse player stats for Tottenham Hotspur Women FC');
  });
});
