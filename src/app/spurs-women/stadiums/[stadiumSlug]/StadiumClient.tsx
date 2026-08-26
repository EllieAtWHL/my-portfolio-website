'use client';

import Link from 'next/link';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import FilteredMatchList from '@/components/spurs-women/FilteredMatchList';
import InteractiveMap from '@/components/spurs-women/InteractiveMap';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { getStadiumNames, getMatchesAtStadium, StadiumName } from '@/lib/data/stadiums';
import { Match } from '@/lib/data/matches';
import { Stadium } from '@/lib/data/stadiums';

interface StadiumClientProps {
  stadium: Stadium;
  stadiumSlug: string;
}

interface StadiumPageData {
  matches: Match[];
  stadiumNames: StadiumName[];
}

const INITIAL_DATA: StadiumPageData = { matches: [], stadiumNames: [] };

export default function StadiumClient({ stadium, stadiumSlug }: StadiumClientProps) {
  const { data, hasError, retry } = useRetryableAsync<StadiumPageData>(
    async () => {
      const [matches, stadiumNames] = await Promise.all([
        getMatchesAtStadium(stadiumSlug),
        getStadiumNames(stadium.id),
      ]);
      return { matches: matches || [], stadiumNames };
    },
    INITIAL_DATA,
    [stadiumSlug, stadium.id],
    'Error loading stadium data:'
  );
  const { matches, stadiumNames } = data;
  const { filteredMatches, onFilteredMatchesChange } = useFilteredMatches(matches);

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
                    <strong>Home club:</strong>{' '}
                    <Link href={`/spurs-women/teams/${stadium.home_team.id}`} className="spurs-text hover:underline">
                      {stadium.home_team.name}
                    </Link>
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
                onRetry={retry}
                cardVariant="spursAccent"
                buttonVariant="spurs"
              />
            ) : (
              <>
                <MatchFilterControls
                  matches={matches}
                  onFilteredMatchesChange={onFilteredMatchesChange}
                  showCompetitionFilter={true}
                  showVenueFilter={true}
                  showAttendedFilter={true}
                  showResultFilter={true}
                  showMonthFilter={false}
                />

                <FilteredMatchList
                  matches={filteredMatches}
                  emptyMessage="No matches found at this stadium."
                  gridClassName="grid gap-4 md:grid-cols-2"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
