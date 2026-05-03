'use client';

import { Card } from '@/components/Card';

interface SeasonReview {
  id?: number;
  season_id: number;
  title: string;
  content: string;
  highlights?: string[];
  created_at?: string;
  updated_at?: string;
}

interface SeasonReviewCardProps {
  review?: SeasonReview | null;
}

export default function SeasonReviewCard({ review }: SeasonReviewCardProps) {
  if (!review) {
    return null;
  }

  return (
    <Card variant="spursAccent" padding="lg" className="mb-8">
      <div className="space-y-4">
        <div>
          <h2 className="spurs-text text-2xl font-bold mb-2">{review.title}</h2>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
            {review.content}
          </div>
        </div>

        {review.highlights && review.highlights.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-2 spurs-text">Key Highlights</h4>
            <ul className="list-disc list-inside space-y-1">
              {review.highlights.map((highlight, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {review.updated_at && (
          <div className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
            Last updated: {new Date(review.updated_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </Card>
  );
}
