'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import SpursSelect from '@/components/spurs-women/SpursSelect';
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

  const competitions = useMemo(() => {
    const uniqueCompetitions = [...new Set(matches.map(match => match.competitions?.name).filter(Boolean))];
    return uniqueCompetitions.sort();
  }, [matches]);

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
    <Card variant="spursAccent" padding="md" className="mb-6" hover={false}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="spurs-text text-sm">
            {filteredMatches.length} of {matches.length} matches
            {hasActiveFilters && ` (${filterCount} filter${filterCount !== 1 ? 's' : ''})`}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 justify-end sm:justify-start w-full sm:w-auto">
          {hasActiveFilters && (
            <Button
              variant="spurs"
              size="sm"
              onClick={clearFilters}
              className="spurs-text px-1 sm:px-3"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg 
                className="w-3 h-3 sm:w-4 sm:h-4 transform scale-200" 
                viewBox="-3.2 -3.2 38.4 38.4" 
                fill="currentColor" 
                stroke="currentColor" 
                strokeWidth={0.00064}
              >
                <path d="M22.5,9A7.4522,7.4522,0,0,0,16,12.792V8H14v8h8V14H17.6167A5.4941,5.4941,0,1,1,22.5,22H22v2h.5a7.5,7.5,0,0,0,0-15Z"/>
                <path d="M26,6H4V9.171l7.4142,7.4143L12,17.171V26h4V24h2v2a2,2,0,0,1-2,2H12a2,2,0,0,1-2-2V18L2.5858,10.5853A2,2,0,0,1,2,9.171V6A2,2,0,0,1,4,4H26Z"/>
                <rect width="32" height="32" fill="none"/>
              </svg>
            </Button>
          )}
          <Button
            variant="spurs"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="spurs-text p-1 sm:px-3"
            title={`Sort by date ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 transform scale-200" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </Button>
          <Button
            variant="spurs"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="spurs-text p-1 sm:px-3"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 transform scale-200 transition-transform duration-200" 
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {showCompetitionFilter && (
            <div className="lg:col-span-2 xl:col-span-1">
              <label className="block spurs-text text-xs font-medium mb-1">
                Competition
              </label>
              <div className="relative">
                <div 
                  className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                  onClick={(e) => {
                    const dropdown = document.getElementById('competition-dropdown');
                    const trigger = e.currentTarget;
                    if (dropdown && trigger) {
                      const rect = trigger.getBoundingClientRect();
                      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                      
                      if (dropdown.style.display === 'block') {
                        dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
                        dropdown.style.left = `${rect.left + window.scrollX}px`;
                        dropdown.style.width = `${rect.width}px`;
                      }
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {competitionFilter.length === 0 
                        ? 'All' 
                        : competitionFilter.length === 1 
                          ? competitionFilter[0]
                          : `${competitionFilter.length} selected`
                      }
                    </span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div 
                  id="competition-dropdown"
                  className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 hidden"
                  style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    minWidth: '200px'
                  }}
                >
                  <div className="p-2">
                    <label className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={competitionFilter.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompetitionFilter([]);
                          }
                        }}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white">All</span>
                    </label>
                    {competitions.map(competition => (
                      <label key={competition || 'unknown'} className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={competitionFilter.includes(competition || 'unknown')}
                          onChange={(e) => {
                            const value = competition || 'unknown';
                            if (e.target.checked) {
                              setCompetitionFilter([...competitionFilter.filter(c => c !== 'unknown'), value]);
                            } else {
                              setCompetitionFilter(competitionFilter.filter(c => c !== value));
                            }
                          }}
                          className="rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">
                          {(competition && competition.length > 20) ? competition.substring(0, 17) + '...' : competition || 'Unknown'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showVenueFilter && (
            <div className="xl:col-span-1">
              <label className="block spurs-text text-xs font-medium mb-1">
                Home/Away
              </label>
              <SpursSelect
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="home">Home</option>
                <option value="away">Away</option>
                <option value="neutral">Neutral</option>
              </SpursSelect>
            </div>
          )}

          {showAttendedFilter && (
            <div className="xl:col-span-1">
              <label className="block spurs-text text-xs font-medium mb-1">
                Attended
              </label>
              <SpursSelect
                value={attendedFilter}
                onChange={(e) => setAttendedFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="attended">Attended</option>
                <option value="not-attended">Not Attended</option>
              </SpursSelect>
            </div>
          )}

          {showResultFilter && (
            <div className="xl:col-span-1">
              <label className="block spurs-text text-xs font-medium mb-1">
                Result
              </label>
              <SpursSelect
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="won">Won</option>
                <option value="draw">Draw</option>
                <option value="lost">Lost</option>
              </SpursSelect>
            </div>
          )}

          {showMonthFilter && (
            <div className="lg:col-span-2 xl:col-span-2">
              <label className="block spurs-text text-xs font-medium mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block spurs-text text-xs font-medium mb-1 opacity-75">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200"
                    style={{
                      WebkitTextFillColor: 'white',
                      color: 'white'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block spurs-text text-xs font-medium mb-1 opacity-75">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200"
                    style={{
                      WebkitTextFillColor: 'white',
                      color: 'white'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
