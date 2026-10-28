import BlueskyPost from './BlueskyPost';
import InstagramPost from './InstagramPost';
import { Media } from '@/types/media';
import { getSocialPlatform } from '@/lib/social-embed';

type MediaListProps = {
  items: Media[];
  title: string;
  layout?: 'full-width' | 'two-column';
};

export default function MediaList({ items, title, layout = 'full-width' }: MediaListProps) {
  if (!items || items.length === 0) return null;

  // Social media posts on a platform we can embed render as embeds; anything
  // else (including a social media post on an unsupported host) falls back to
  // a plain link rather than silently rendering nothing.
  const socialMediaItems = items.flatMap(item => {
    const platform = item.type === 'social media' ? getSocialPlatform(item.url) : null;
    return platform ? [{ item, platform }] : [];
  });
  const embeddedIds = new Set(socialMediaItems.map(({ item }) => item.id));
  const otherItems = items.filter(item => !embeddedIds.has(item.id));

  // Determine grid classes based on layout
  const socialMediaGridClasses = layout === 'two-column' 
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'space-y-4';

  return (
    <div>
      <h2 className="font-bold media-title">{title}</h2>
      
      {socialMediaItems.length > 0 && (
        <div className="mb-4">
          <div className={socialMediaGridClasses}>
            {socialMediaItems.map(({ item, platform }) => (
              <div key={item.id} className={layout === 'two-column' ? '' : 'mb-4'}>
                {platform === 'instagram' ? (
                  <InstagramPost url={item.url} />
                ) : (
                  <BlueskyPost url={item.url} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {otherItems.length > 0 && (
        <div className="space-y-2">
          {otherItems.map((item) => (
            <div key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="spurs-text venue-link hover:underline"
              >
                {item.title && item.title.trim() !== '' ? item.title : item.url}
              </a>{' '}
              <span className="text-gray-400 text-sm">↗</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
