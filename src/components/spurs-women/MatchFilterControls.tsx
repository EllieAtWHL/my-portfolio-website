'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { CompetitionFilter } from './filters/CompetitionFilter';
import { VenueFilter } from './filters/VenueFilter';
import { AttendedFilter } from './filters/AttendedFilter';
import { ResultFilter } from './filters/ResultFilter';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { Match } from '@/lib/data/matches';

interface MatchFilterControlsProps {
  matches: Match[];
  onFilteredMatchesChange: (filteredMatches: Match[]) => void;
  showCompetitionFilter?: boolean;
  showVenueFilter?: boolean;
  showAttendedFilter?: boolean;
  showResultFilter?: boolean;
  showMonthFilter?: boolean;
}

export default function MatchFilterControls({
  matches,
  onFilteredMatchesChange,
  showCompetitionFilter = true,
  showVenueFilter = true,
  showAttendedFilter = true,
  showResultFilter = true,
  showMonthFilter = true
}: MatchFilterControlsProps) {
  const [competitionFilter, setCompetitionFilter] = useState<string[]>([]);
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [attendedFilter, setAttendedFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredMatches = useMemo(() => {
    const filtered = matches.filter(match => {
      if (showCompetitionFilter && competitionFilter.length > 0) {
        if (competitionFilter.includes('unknown')) {
          if (match.competitions?.name) return false;
        } else {
          if (!match.competitions?.name || !competitionFilter.includes(match.competitions.name)) return false;
        }
      }

      if (showVenueFilter && venueFilter !== 'all') {
        if (venueFilter === 'home' && !match.is_home_match) return false;
        if (venueFilter === 'away' && match.is_home_match) return false;
        if (venueFilter === 'neutral' && !match.is_neutral_venue) return false;
      }

      if (showAttendedFilter && attendedFilter !== 'all') {
        if (attendedFilter === 'attended' && !match.attended) return false;
        if (attendedFilter === 'not-attended' && match.attended) return false;
      }

      if (showResultFilter && resultFilter !== 'all') {
        const hasScore = match.spurs_score !== null && match.opponent_score !== null;
        if (!hasScore) return false;

        const spursScore = match.spurs_score!;
        const opponentScore = match.opponent_score!;
        const isWin = spursScore > opponentScore;
        const isDraw = spursScore === opponentScore;
        const isLoss = spursScore < opponentScore;

        if (resultFilter === 'won' && !isWin) return false;
        if (resultFilter === 'draw' && !isDraw) return false;
        if (resultFilter === 'lost' && !isLoss) return false;
      }

      if (showMonthFilter && (dateFromFilter || dateToFilter)) {
        const matchDate = new Date(match.date);
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (matchDate < fromDate) return false;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          if (matchDate > toDate) return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }, [matches, competitionFilter, venueFilter, attendedFilter, resultFilter, dateFromFilter, dateToFilter, showCompetitionFilter, showVenueFilter, showAttendedFilter, showResultFilter, showMonthFilter, sortOrder]);

  const prevFilteredMatchesRef = useRef<Match[]>([]);

  useEffect(() => {
    if (JSON.stringify(prevFilteredMatchesRef.current) !== JSON.stringify(filteredMatches)) {
      onFilteredMatchesChange(filteredMatches);
      prevFilteredMatchesRef.current = filteredMatches;
    }
  }, [filteredMatches, onFilteredMatchesChange]);

  const clearFilters = () => {
    setCompetitionFilter([]);
    setVenueFilter('all');
    setAttendedFilter('all');
    setResultFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters = (showCompetitionFilter && competitionFilter.length > 0) ||
                          (showVenueFilter && venueFilter !== 'all') ||
                          (showAttendedFilter && attendedFilter !== 'all') ||
                          (showResultFilter && resultFilter !== 'all') ||
                          (showMonthFilter && (dateFromFilter || dateToFilter));

  const filterCount = [
    showCompetitionFilter && competitionFilter.length > 0 ? competitionFilter.length : 0,
    showVenueFilter && venueFilter !== 'all',
    showAttendedFilter && attendedFilter !== 'all',
    showResultFilter && resultFilter !== 'all',
    showMonthFilter && (dateFromFilter || dateToFilter)
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Header with title, match count, and buttons outside the card */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="spurs-text text-lg font-semibold">Match Filter</h2>
          <span className="spurs-text text-sm">
            {filteredMatches.length} of {matches.length} matches
            {hasActiveFilters && ` (${filterCount} filter${filterCount !== 1 ? 's' : ''})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="spurs"
              size="xs"
              onClick={clearFilters}
              aria-label="Clear filters"
            >
              <svg
                className="w-4 h-4"
                viewBox="-3.2 -3.2 38.4 38.4"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={4}
              >
                <path d="M22.5,9A7.4522,7.4522,0,0,0,16,12.792V8H14v8h8V14H17.6167A5.4941,5.4941,0,1,1,22.5,22H22v2h.5a7.5,7.5,0,0,0,0-15Z"/>
                <path d="M26,6H4V9.171l7.4142,7.4143L12,17.171V26h4V24h2v2a2,2,0,0,1-2,2H12a2,2,0,0,1-2-2V18L2.5858,10.5853A2,2,0,0,1,2,9.171V6A2,2,0,0,1,4,4H26Z"/>
                <rect width="32" height="32" fill="none"/>
              </svg>
            </Button>
          )}
          <Button
            variant="spurs"
            size="xs"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            aria-label={`Sort by date ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </Button>
          <Button
            variant="spurs"
            size="xs"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Only show card when expanded */}
      {isExpanded && (
        <Card variant="spursAccent" padding="md" clickable={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {showCompetitionFilter && (
              <CompetitionFilter matches={matches} value={competitionFilter} onChange={setCompetitionFilter} />
            )}

            {showVenueFilter && (
              <VenueFilter value={venueFilter} onChange={setVenueFilter} />
            )}

            {showAttendedFilter && (
              <AttendedFilter value={attendedFilter} onChange={setAttendedFilter} />
            )}

            {showResultFilter && (
              <ResultFilter value={resultFilter} onChange={setResultFilter} />
            )}

            {showMonthFilter && (
              <DateRangeFilter
                fromValue={dateFromFilter}
                toValue={dateToFilter}
                onFromChange={setDateFromFilter}
                onToChange={setDateToFilter}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
