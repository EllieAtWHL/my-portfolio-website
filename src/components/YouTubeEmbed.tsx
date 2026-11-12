import { ConsentGatedEmbed } from './ConsentGatedEmbed';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

// A consent-gated YouTube iframe (WEB-104): www.youtube.com/embed sets
// long-lived identifier cookies on load, so it only renders once "Embedded
// content" is allowed. Both the embed URL and the fallback watch link are
// derived from videoId, so they can't drift apart.
export function YouTubeEmbed({ videoId, title = 'YouTube video player' }: YouTubeEmbedProps) {
  return (
    <ConsentGatedEmbed
      service="YouTube"
      href={`https://www.youtube.com/watch?v=${videoId}`}
      linkLabel="Watch this video on YouTube"
    >
      <div className="video-container">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="video-iframe"
        ></iframe>
      </div>
    </ConsentGatedEmbed>
  );
}
