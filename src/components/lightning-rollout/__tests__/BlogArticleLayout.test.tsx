import { render, screen } from '@testing-library/react';
import { BlogArticleLayout } from '../BlogArticleLayout';

describe('BlogArticleLayout', () => {
  const navLeft = { label: '← Back', href: '/lightning-rollout' };
  const navRight = { label: 'Next →', href: '/lightning-rollout/part-2' };

  it('renders the title, hero image, and children', () => {
    render(
      <BlogArticleLayout title="Test Article" navLeft={navLeft} navRight={navRight}>
        <p>Article body</p>
      </BlogArticleLayout>
    );

    expect(screen.getByRole('heading', { name: 'Test Article' })).toBeInTheDocument();
    expect(screen.getByAltText('Lightning Strike')).toHaveAttribute('src', '/lightning-rollout/lightning.jpeg');
    expect(screen.getByText('Article body')).toBeInTheDocument();
  });

  it('shows the "Originally posted on Medium" line when mediumUrl is given', () => {
    render(
      <BlogArticleLayout
        title="Test Article"
        mediumUrl="https://medium.com/example"
        mediumDate="April 2020"
        navLeft={navLeft}
        navRight={navRight}
      >
        <p>Article body</p>
      </BlogArticleLayout>
    );

    expect(screen.getByText(/Originally posted on/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute('href', 'https://medium.com/example');
    expect(screen.getByText(/April 2020/)).toBeInTheDocument();
  });

  it('omits the "Originally posted on Medium" line when mediumUrl is not given', () => {
    render(
      <BlogArticleLayout title="Test Article" navLeft={navLeft} navRight={navRight}>
        <p>Article body</p>
      </BlogArticleLayout>
    );

    expect(screen.queryByText(/Originally posted on/)).not.toBeInTheDocument();
  });

  it('renders the nav links', () => {
    render(
      <BlogArticleLayout title="Test Article" navLeft={navLeft} navRight={navRight}>
        <p>Article body</p>
      </BlogArticleLayout>
    );

    expect(screen.getByRole('link', { name: '← Back' })).toHaveAttribute('href', '/lightning-rollout');
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute('href', '/lightning-rollout/part-2');
  });
});
