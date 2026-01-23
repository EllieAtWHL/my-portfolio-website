'use client';

import { Media } from '@/types/media';
import { Card } from '@/components/Card';

interface ArticleCardProps {
  article: Media;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  // Use title from database, fallback to URL
  const displayTitle = article.title || article.url;
  
  // Calculate domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return '';
    }
  };
  
  const domain = getDomain(article.url);

  return (
    <Card variant="spursAccent" className="overflow-hidden">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block spurs-text hover:opacity-90 transition-opacity"
      >
        <div className="flex items-start space-x-3 p-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">
              {displayTitle}
            </h3>
            {domain && (
              <p className="text-xs text-gray-500 truncate">{domain}</p>
            )}
          </div>

          {/* External link indicator */}
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </a>
    </Card>
  );
}
