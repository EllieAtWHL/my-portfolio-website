'use client';

import { Media } from '@/types/media';
import { Card } from '@/components/Card';
import { ExternalLinkIcon } from './ExternalLinkIcon';

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
    } catch {
      return '';
    }
  };
  
  const domain = getDomain(article.url);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block spurs-text"
    >
      <Card variant="spursAccent" clickable={true} className="overflow-hidden">
        <div className="flex items-start space-x-3 p-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2">
              {displayTitle}
            </h3>
            {domain && (
              <p className="text-xs spurs-text opacity-75 truncate">{domain}</p>
            )}
          </div>

          {/* External link indicator */}
          <div className="flex-shrink-0">
            <ExternalLinkIcon />
          </div>
        </div>
      </Card>
    </a>
  );
}
