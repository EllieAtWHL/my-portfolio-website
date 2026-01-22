'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UpdateBanner from './UpdateBanner';

const BLOGPOST_MAP = [
  { title: 'It Begins...', url: '/london-2012/it-begins' },
  { title: 'An Invitation', url: '/london-2012/an-invitation-to-audition' },
  { title: 'My First Audition', url: '/london-2012/my-first-audition' },
  { title: 'Drumming?!?', url: '/london-2012/drumming-audition' },
  { title: 'The Decision Arrives', url: '/london-2012/the-decision-arrives' },
  { title: 'My First Rehearsal', url: '/london-2012/my-first-rehearsal' },
  { title: '1,000 Drummers', url: '/london-2012/1000-drummers' },
  { title: 'Costume Fittings & Goodbye to 3 Mills', url: '/london-2012/costume-fitting' },
];

interface London2012SidebarProps {
  mode?: 'large' | 'small';
  showHeader?: boolean;
}

export default function London2012Sidebar({ mode = 'small', showHeader = true }: London2012SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`london-2012-sidebar ${mode === 'large' ? 'centre' : ''}`}>
      {showHeader && (
        <>
          {mode === 'large' ? (
            <h1 className="text-3xl font-bold mb-2">My Olympic Journey</h1>
          ) : (
            <h3 className="text-xl font-bold mb-2">My Olympic Journey</h3>
          )}
        </>
      )}
      <UpdateBanner 
        message="More stories coming soon."
        type="info"
        className="mb-6"
      />
      <h4 className="text-lg font-semibold mb-4">Posts</h4>
      
      <ul className="space-y-2">
        {BLOGPOST_MAP.map((post) => (
          <li key={post.url}>
            {pathname === post.url ? (
              <span className="active-page-text font-bold text-lg border-l-4 border-brand-primary-dark dark:border-dark-accent pl-3 py-1 block">{post.title}</span>
            ) : (
              <Link 
                href={post.url}
                className="brand-primary-dark hover:brand-primary-darker transition-colors"
              >
                {post.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
