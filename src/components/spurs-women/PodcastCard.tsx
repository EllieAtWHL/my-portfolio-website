'use client';

import Link from 'next/link';
import { Card } from '@/components/Card';

interface PodcastEpisode {
  title: string;
  episodeNumber: string;
  description: string;
  duration: string;
  publishDate: string;
  url: string;
  podcastName: string;
}

interface PodcastCardProps {
  episode: PodcastEpisode;
}

export default function PodcastCard({ episode }: PodcastCardProps) {
  const getLogoSrc = () => {
    switch (episode.podcastName) {
      case 'N17 Women':
        return '/spurs-women/N17WomenLogo.jpg';
      case 'Hometown Glory':
        return '/spurs-women/HometownGloryLogo.jpeg';
      default:
        return null;
    }
  };

  const logoSrc = getLogoSrc();

  return (
    <Card variant="spursAccent" padding="md">
      <div className="flex items-start space-x-4 mb-3">
        {logoSrc && (
          <img 
            src={logoSrc} 
            alt={`${episode.podcastName} logo`}
            className="w-16 h-16 object-contain flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg spurs-text mb-1">
            {episode.episodeNumber}
          </h3>
          <h4 className="text-md font-medium spurs-text mb-2">
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
        className="spurs-text inline-flex items-center justify-center w-full text-sm font-medium"
      >
        Listen Now
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </Card>
  );
}
