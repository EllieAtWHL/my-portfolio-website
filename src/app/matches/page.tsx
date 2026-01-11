'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MatchCard from '@components/MatchCard';
import { supabase } from '@utils/supabase';

export default function MatchesPage() {
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'previous'>('all');

  useEffect(() => {
    // Set page title
    document.title = 'Matches - Tottenham Hotspur Women';
    
    async function fetchAllMatches() {
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
      } else {
        setAllMatches(data || []);
      }
      
      setLoading(false);
    }

    fetchAllMatches();
  }, [filter]);

  if (loading) return <p className="p-8">Loading matches...</p>;

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>
        
        {/* Filter buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded transition-colors ${
              filter === 'upcoming' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upcoming Only
          </button>
          <button
            onClick={() => setFilter('previous')}
            className={`px-4 py-2 rounded transition-colors ${
              filter === 'previous' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous Only
          </button>
        </div>
      </div>

      {/* Matches list */}
      <div className="space-y-4">
        {allMatches.length > 0 ? (
          allMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <p className="text-center text-gray-500 italic">
            {filter === 'upcoming' 
              ? 'No upcoming matches scheduled' 
              : filter === 'previous' 
                ? 'No previous matches' 
                : 'No matches found'
            }
          </p>
        )}
      </div>

      {/* Back to home link */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
