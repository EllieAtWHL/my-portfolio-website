'use client';

import Link from 'next/link';

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
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="spurs-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-spurs-navy line-clamp-2 flex-1 mr-2">
          <Link 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="spurs-link hover:text-spurs-blue-light transition-colors"
          >
            {article.title}
          </Link>
        </h3>
        {article.source && (
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            article.source === 'BBC Sport' 
              ? 'bg-yellow-100 text-yellow-800' 
              : article.source === 'Football London'
              ? 'bg-purple-100 text-purple-800'
              : article.source === 'Spurs Women Blog'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {article.source}
          </span>
        )}
      </div>
      <p className="text-sm text-spurs-gray mb-3">
        {formatDate(article.isoDate)}
      </p>
      <p className="text-gray-700 line-clamp-3">
        {article.contentSnippet}
      </p>
      <Link 
        href={article.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="spurs-link inline-block mt-4 text-sm font-medium"
      >
        Read more →
      </Link>
    </div>
  );
}
