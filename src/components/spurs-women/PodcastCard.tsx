'use client';

import Link from 'next/link';

interface PodcastEpisode {
  title: string;
  episodeNumber: string;
  description: string;
  duration: string;
  publishDate: string;
  url: string;
}

interface PodcastCardProps {
  episode: PodcastEpisode;
}

export default function PodcastCard({ episode }: PodcastCardProps) {
  return (
    <div className="spurs-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-spurs-navy mb-1">
            {episode.episodeNumber}
          </h3>
          <h4 className="text-md font-medium text-spurs-navy mb-2">
            {episode.title}
          </h4>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {episode.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-spurs-gray mb-4">
        <span>{episode.duration}</span>
        <span>{episode.publishDate}</span>
      </div>
      
      <Link
        href={episode.url}
        target="_blank"
        rel="noopener noreferrer"
        className="spurs-button inline-flex items-center justify-center w-full"
      >
        Listen Now
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
}
