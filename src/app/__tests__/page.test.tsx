import React from 'react';
import { render } from '@testing-library/react';
import Home, { metadata } from '../page';
import { PROFILE_URLS, SITE_URL } from '@/lib/site';

jest.mock('@/components/HomeHero', () => {
  return function MockHomeHero() {
    return <div data-testid="home-hero" />;
  };
});

describe('Home page (server)', () => {
  it('renders Person structured data with the sameAs profiles', () => {
    const { container, getByTestId } = render(<Home />);
    expect(getByTestId('home-hero')).toBeInTheDocument();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    const person = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'Person');

    expect(person.name).toBe('Ellie Matthewman');
    expect(person.url).toBe(SITE_URL);
    expect(person.sameAs).toEqual([...PROFILE_URLS]);
    expect(person.award).toContain('Salesforce Golden Hoodie (2026)');
  });

  it('has a name-first absolute title and a canonical URL', () => {
    expect(metadata.title).toEqual({ absolute: expect.stringContaining('Ellie Matthewman') });
    expect(metadata.alternates?.canonical).toBe('/');
  });
});
