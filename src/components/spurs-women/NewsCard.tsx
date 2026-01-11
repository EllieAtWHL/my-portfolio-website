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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 line-clamp-2 flex-1 mr-2">
          <Link 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {article.title}
          </Link>
        </h3>
        {article.source && (
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            article.source === 'BBC Sport' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
              : article.source === 'Football London'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : article.source === 'Spurs Women Blog'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {article.source}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {formatDate(article.isoDate)}
      </p>
      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
        {article.contentSnippet}
      </p>
      <Link 
        href={article.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
      >
        Read more →
      </Link>
    </div>
  );
}
