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
}

export default function London2012Sidebar({ mode = 'small' }: London2012SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`london-2012-sidebar ${mode === 'large' ? 'centre' : ''}`}>
      {mode === 'large' ? (
        <h1 className="text-3xl font-bold mb-2">My Olympic Journey</h1>
      ) : (
        <h3 className="text-xl font-bold mb-2">My Olympic Journey</h3>
      )}
      <UpdateBanner 
        message="blog is currently being expanded with more stories and memories from my Olympic journey. Additional content and photos are being added regularly."
        highlightedText="London 2012"
        type="info"
      />
      <h4 className="text-lg font-semibold mb-4">Posts</h4>
      
      <ul className="space-y-2">
        {BLOGPOST_MAP.map((post) => (
          <li key={post.url}>
            {pathname === post.url ? (
              <span className="text-current font-medium">{post.title}</span>
            ) : (
              <Link 
                href={post.url}
                className="brand-primary-dark hover:brand-primary-darker dark:border dark:hover:dark-gray-medium transition-colors"
              >
                {post.title}
              </Link>
            )}
          </li>
        ))}
        <li className="neutral-gray dark:dark-gray-medium italic">More coming soon...</li>
      </ul>
    </div>
  );
}
