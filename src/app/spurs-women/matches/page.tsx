'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/Button';

type Match = {
  id: number;
  date: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string;
    secondary_color: string;
    is_tottenham: boolean;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string;
    secondary_color: string;
    is_tottenham: boolean;
  };
  spurs_score: number;
  opponent_score: number;
  attended: boolean;
  is_home_match: boolean;
  competitions?: {
    name: string;
    icon_svg?: string;
  };
};

export default function MatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'previous'>('all');

  useEffect(() => {
    async function fetchAllMatches() {
      try {
        setLoading(true);
        setError(null);
        
        const now = new Date().toISOString();
        
        let query = supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id (*),
            away_team:away_team_id (*),
            competitions:competition_id (*)
          `)
          .order('date', { ascending: false });

        // Apply filter if not showing all matches
        if (filter === 'upcoming') {
          query = query.gte('date', now);
        } else if (filter === 'previous') {
          query = query.lt('date', now);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching matches:', error);
          setError('Failed to load matches');
        } else {
          setAllMatches(data as Match[] || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAllMatches();
  }, [filter]);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="spurs-text text-3xl font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>
          
          {/* Filter buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              All Matches
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'primary' : 'secondary'}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming Only
            </Button>
            <Button
              variant={filter === 'previous' ? 'primary' : 'secondary'}
              onClick={() => setFilter('previous')}
            >
              Previous Only
            </Button>
          </div>
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading matches...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {allMatches.length > 0 ? (
              allMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-gray-500 italic">
                  {filter === 'upcoming' 
                    ? 'No upcoming matches scheduled' 
                    : filter === 'previous' 
                      ? 'No previous matches' 
                      : 'No matches found'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back to seasons link */}
        <div className="mt-12 text-center">
          <Link href="/spurs-women/seasons">
            <Button variant="secondary">
              Back to Seasons
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
