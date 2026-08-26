import { Button } from '@/components/Button';

interface BlogNavLink {
  label: string;
  href: string;
}

interface BlogNavigationProps {
  left: BlogNavLink;
  right: BlogNavLink;
}

export function BlogNavigation({ left, right }: BlogNavigationProps) {
  return (
    <div className="blog-navigation">
      <div className="nav-links">
        <Button variant="primary" asChild>
          <a href={left.href}>{left.label}</a>
        </Button>
        <Button variant="primary" asChild>
          <a href={right.href}>{right.label}</a>
        </Button>
      </div>
    </div>
  );
}
