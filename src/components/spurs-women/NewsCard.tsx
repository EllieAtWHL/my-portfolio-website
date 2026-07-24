'use client';

import Link from 'next/link';
import { formatDateForCard } from '@/lib/utils/date';
import { Card } from '@/components/Card';

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
  source?: string;
}

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Card variant="spursAccent" padding="md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold spurs-text line-clamp-2 flex-1 mr-2">
          <Link 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="spurs-text"
          >
            {article.title}
          </Link>
        </h3>
        {article.source && (
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            article.source === 'BBC Sport' || article.source === 'Spurs Women Blog'
              ? 'bg-yellow-500 text-black'
              : article.source === 'The Guardian' || article.source === 'Cartilage Free Captain'
              ? 'bg-blue-900 text-white'
              : article.source === 'WSL Full-Time'
              ? 'bg-teal-400 text-black'
              : article.source === 'She Kicks' || article.source === 'Girls on the Ball'
              ? 'bg-purple-700 text-white'
              : article.source === 'Spurs Across the Pond'
              ? 'bg-sky-400 text-black'
              : article.source === 'Veinte Futbol'
              ? 'bg-neutral-800 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {article.source}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {formatDateForCard(article.isoDate)}
      </p>
      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
        {article.contentSnippet}
      </p>
      <Link 
        href={article.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block mt-4 spurs-text text-sm font-medium"
      >
        Read more →
      </Link>
    </Card>
  );
}
