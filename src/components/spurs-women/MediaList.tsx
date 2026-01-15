import BlueskyPost from './BlueskyPost';

type Media = {
  id: number;
  url: string;
  title?: string | null;
  type?: string;
};

type MediaListProps = {
  items: Media[];
  title: string;
};

export default function MediaList({ items, title }: MediaListProps) {
  if (!items || items.length === 0) return null;

  const socialMediaItems = items.filter(item => item.type === 'social media');
  const otherItems = items.filter(item => item.type !== 'social media');

  return (
    <div>
      <h2 className="text-2xl font-bold media-title">{title}</h2>
      
      {/* Social media items without bullet points */}
      {socialMediaItems.length > 0 && (
        <div className="mb-4">
          {socialMediaItems.map((item) => (
            <div key={item.id} className="mb-4">
              <BlueskyPost url={item.url} />
            </div>
          ))}
        </div>
      )}

      {/* Other media items with bullet points */}
      {otherItems.length > 0 && (
        <ul className="list-disc list-inside">
          {otherItems.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="spurs-text venue-link hover:underline"
              >
                {item.title && item.title.trim() !== '' ? item.title : item.url}
              </a>{' '}
              <span className="text-gray-400 text-sm">↗</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
