import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutMe, { metadata } from '../page';
import { SITE_IMAGE } from '@/lib/site';

jest.mock('@/components/MainSitePage', () => {
  return function MockMainSitePage({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-site-page">{children}</div>;
  };
});

describe('About Me page', () => {
  it('renders the page heading and tagline inside MainSitePage', () => {
    render(<AboutMe />);

    expect(screen.getByTestId('main-site-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'About Me' })).toBeInTheDocument();
    expect(screen.getByText('Trailblazer. Mentor. Champion.')).toBeInTheDocument();
  });

  // The name in visible text and the photo alt is what ties this page to a
  // "Ellie Matthewman" search (WEB-238).
  it('names Ellie Matthewman in the intro and the profile photo alt text', () => {
    render(<AboutMe />);

    expect(
      screen.getByRole('heading', { level: 2, name: /Ellie Matthewman/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ellie Matthewman' })).toBeInTheDocument();
  });

  it('mentions the Golden Hoodie award', () => {
    render(<AboutMe />);

    expect(
      screen.getByText(/Salesforce Golden Hoodie at the AiForce London World Tour/)
    ).toBeInTheDocument();
  });

  it('links to the community group, Regicide, the London 2012 blog, contact and experience pages', () => {
    render(<AboutMe />);

    expect(screen.getByRole('link', { name: 'London Salesforce Developer Group' })).toHaveAttribute(
      'href',
      'https://trailblazercommunitygroups.com/salesforce-developer-group-london-united-kingdom/'
    );
    expect(screen.getByRole('link', { name: 'Regicide' })).toHaveAttribute('href', '/regicide');
    expect(screen.getByRole('link', { name: 'my blog' })).toHaveAttribute('href', '/london-2012/');
    expect(screen.getByRole('link', { name: 'Get In Touch' })).toHaveAttribute('href', '/contact-me');
    expect(screen.getByRole('link', { name: 'View My Experience' })).toHaveAttribute('href', '/experience');
  });

  it('opens external links in a new tab safely', () => {
    render(<AboutMe />);

    const external = screen.getByRole('link', { name: 'London Salesforce Developer Group' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('exports name-bearing metadata with an existing share image', () => {
    expect(metadata.title).toBe('About Me');
    expect(metadata.description).toContain('Ellie Matthewman');
    expect(metadata.openGraph.images).toEqual([SITE_IMAGE]);
    expect(metadata.twitter.images).toEqual([SITE_IMAGE]);
  });
});
