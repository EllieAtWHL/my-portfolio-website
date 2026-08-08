'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import MatchCard from '@/components/spurs-women/MatchCard';
import InteractiveMap from '@/components/spurs-women/InteractiveMap';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { getStadiumNames, getMatchesAtStadium, StadiumName } from '@/lib/data/stadiums';
import { Match } from '@/lib/data/matches';
import { Stadium } from '@/lib/data/stadiums';

interface StadiumClientProps {
  stadium: Stadium;
  stadiumSlug: string;
}

export default function StadiumClient({ stadium, stadiumSlug }: StadiumClientProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [stadiumNames, setStadiumNames] = useState<StadiumName[]>([]);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleFilteredMatchesChange = useCallback((newFilteredMatches: Match[]) => {
    setFilteredMatches(newFilteredMatches);
  }, []);

  // Fetch logic stays local to the effect (rather than a shared useCallback
  // also called from the retry button) - keeps react-hooks/set-state-in-effect
  // happy, since it flags a memoized fetch function reachable from both an
  // effect and an external handler even though these setState calls only
  // ever run after the awaited request settles. Retrying bumps retryCount
  // to re-trigger this same effect.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matches, names] = await Promise.all([
          getMatchesAtStadium(stadiumSlug),
          getStadiumNames(stadium.id)
        ]);

        setMatches(matches || []);
        setFilteredMatches(matches || []);
        setStadiumNames(names);
        setHasError(false);
      } catch (error) {
        console.error('Error loading stadium data:', error);
        setHasError(true);
      }
    };

    fetchData();
  }, [stadiumSlug, stadium.id, retryCount]);

  const retryFetchData = () => setRetryCount((count) => count + 1);

  return (
    <main id="main-content" className="p-4 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="spurs-text font-bold mb-2">{stadium.name}</h1>
          {stadium.city && stadium.country && (
            <p className="spurs-text text-xl mb-4">
              {stadium.city}, {stadium.country}
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {(stadium.address_line_1 || stadium.home_team || stadium.opened_date || stadium.capacity || stadiumNames.length > 0) && (
            <div className="lg:col-span-1">
              <Card variant="spursAccent" padding="md" hover={false}>
                <h3 className="font-bold mb-4">Stadium Details</h3>
              
              <div className="space-y-3">
                {stadium.address_line_1 && (
                  <div>
                    <strong>Address:</strong> {stadium.address_line_1}
                    {stadium.postcode && `, ${stadium.postcode}`}
                  </div>
                )}
                
                {stadium.home_team && (
                  <div>
                    <strong>Home club:</strong> {stadium.home_team.name}
                  </div>
                )}
                
                {stadium.opened_date && (
                  <div>
                    <strong>Year opened:</strong> {new Date(stadium.opened_date).getFullYear()}
                  </div>
                )}
                
                {stadium.capacity && (
                  <div>
                    <strong>Capacity:</strong> {stadium.capacity.toLocaleString()}
                  </div>
                )}
                
                {stadiumNames.length > 0 && (
                  <div>
                    <strong>Also known as:</strong>
                    <ul className="mt-1 space-y-1">
                      {stadiumNames.map((stadiumName) => (
                        <li key={stadiumName.id} className="spurs-text">
                          {stadiumName.name}
                          {stadiumName.valid_from && (
                            <span className="text-sm text-gray-500"> ({new Date(stadiumName.valid_from).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}{stadiumName.valid_to ? ` - ${new Date(stadiumName.valid_to).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ' - present'})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>
          )}

          {stadium.latitude && stadium.longitude && (
            <div className="lg:col-span-1">
              <Card variant="spursAccent" padding="md" hover={false}>
                <h3 className="font-bold mb-4">Location</h3>
                <InteractiveMap 
                  latitude={stadium.latitude}
                  longitude={stadium.longitude}
                  stadiumName={stadium.name}
                />
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <h2 className="spurs-text font-bold mb-4">Matches at {stadium.name}</h2>

            {hasError ? (
              <ErrorState
                message="Couldn't load matches for this stadium. Please try again."
                onRetry={retryFetchData}
                cardVariant="spursAccent"
                buttonVariant="spurs"
              />
            ) : (
              <>
                <MatchFilterControls
                  matches={matches}
                  onFilteredMatchesChange={handleFilteredMatchesChange}
                  showCompetitionFilter={true}
                  showVenueFilter={true}
                  showAttendedFilter={true}
                  showResultFilter={true}
                  showMonthFilter={false}
                />

                {filteredMatches.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card variant="spursAccent" padding="md" hover={false}>
                    <p className="spurs-text">
                      No matches found at this stadium.
                    </p>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
