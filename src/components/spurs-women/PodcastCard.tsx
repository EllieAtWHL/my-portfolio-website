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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
            {episode.episodeNumber}
          </h3>
          <h4 className="text-md font-medium text-spurs-navy dark:text-blue-400 mb-2">
            {episode.title}
          </h4>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
        {episode.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>{episode.duration}</span>
        <span>{episode.publishDate}</span>
      </div>
      
      <Link
        href={episode.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full bg-spurs-navy hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Listen Now
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
}
