import Image from 'next/image';
import { BlogNavigation } from './BlogNavigation';

interface BlogNavLink {
  label: string;
  href: string;
}

interface BlogArticleLayoutProps {
  title: string;
  /** Omit for parts with no "Originally posted on Medium..." line (e.g. Part 3). */
  mediumUrl?: string;
  mediumDate?: string;
  navLeft: BlogNavLink;
  navRight: BlogNavLink;
  children: React.ReactNode;
}

export function BlogArticleLayout({ title, mediumUrl, mediumDate, navLeft, navRight, children }: BlogArticleLayoutProps) {
  return (
    <div className="blog-article">
      <article className="blog-content">
        <h1 className="blog-main-title">{title}</h1>

        <div className="blog-hero-image">
          <Image
            src="/lightning-rollout/lightning.jpeg"
            alt="Lightning Strike"
            width={1400}
            height={933}
            className="hero-image"
            priority
          />
        </div>

        {mediumUrl && (
          <div className="blog-meta">
            <p><em>Originally posted on <a href={mediumUrl} target="_blank" rel="noopener noreferrer">Medium</a> in {mediumDate}</em></p>
          </div>
        )}

        {children}

        <BlogNavigation left={navLeft} right={navRight} />
      </article>
    </div>
  );
}
