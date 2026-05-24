import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, SelectInput, NumberInput } from './FormField';

interface Team {
  id: number;
  short_name: string;
}

interface Competition {
  id: string;
  nickname: string;
}

interface Season {
  id: string;
  name: string;
}

interface Match {
  id: string;
  season_id: string;
  date: string;
  home_team_id: number;
  away_team_id: number;
  competition_id: string;
}

interface MediaForm {
  match_id: string;
  type: 'photo' | 'photo album' | 'article' | 'social media' | 'video-external';
  title: string | null;
  url: string;
  caption: string | null;
  sort_order: number;
}

interface MediaFormProps {
  mediaForm: Partial<MediaForm>;
  setMediaForm: (form: Partial<MediaForm>) => void;
  mediaSeason: string;
  setMediaSeason: (season: string) => void;
  matches: Match[];
  seasons: Season[];
  teams: Team[];
  competitions: Competition[];
  isMediaEditMode: boolean;
  editingMediaId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function MediaForm({
  mediaForm,
  setMediaForm,
  mediaSeason,
  setMediaSeason,
  matches,
  seasons,
  teams,
  competitions,
  isMediaEditMode,
  editingMediaId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: MediaFormProps) {
  return (
    <FormWrapper
      title="Media"
      isEditMode={isMediaEditMode}
      editingId={editingMediaId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Season" htmlFor="media-season">
            <SelectInput
              id="media-season"
              value={mediaSeason}
              onChange={(value) => setMediaSeason(value)}
              options={(() => {
                const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => ({ value: season.id, label: season.name }));
              })()}
              placeholder="All seasons"
            />
          </FormField>
          
          <FormField label="Match" required htmlFor="media-match">
            <SelectInput
              id="media-match"
              value={mediaForm.match_id || ''}
              onChange={(value) => setMediaForm({ ...mediaForm, match_id: value as string })}
              options={matches.filter(match => !mediaSeason || match.season_id === mediaSeason).map(match => {
                const homeTeam = teams.find(t => t.id === match.home_team_id);
                const awayTeam = teams.find(t => t.id === match.away_team_id);
                const competition = competitions.find(c => c.id === match.competition_id);
                
                return {
                  value: match.id,
                  label: `${homeTeam?.short_name} vs ${awayTeam?.short_name} - ${competition?.nickname} (${match.date})`
                };
              })}
              required
              placeholder="Select match"
            />
          </FormField>

          <FormField label="Media Type" required htmlFor="media-type">
            <SelectInput
              id="media-type"
              value={mediaForm.type || 'social media'}
              onChange={(value) => setMediaForm({ ...mediaForm, type: value as MediaForm['type'] })}
              options={[
                { value: 'social media', label: 'Social Media' },
                { value: 'article', label: 'Article' },
                { value: 'photo', label: 'Photo' },
                { value: 'photo album', label: 'Photo Album' },
                { value: 'video-external', label: 'External Video' }
              ]}
              required
              placeholder="Select media type"
            />
          </FormField>

          <FormField label="Title" htmlFor="media-title">
            <TextInput
              id="media-title"
              value={mediaForm.title || ''}
              onChange={(value) => setMediaForm({ ...mediaForm, title: value })}
            />
          </FormField>

          <FormField label="URL" required htmlFor="media-url">
            <TextInput
              id="media-url"
              value={mediaForm.url || ''}
              onChange={(value) => setMediaForm({ ...mediaForm, url: value })}
              required
            />
          </FormField>

          <FormField label="Sort Order" htmlFor="media-sort-order">
            <NumberInput
              id="media-sort-order"
              value={mediaForm.sort_order || 0}
              onChange={(value) => setMediaForm({ ...mediaForm, sort_order: value || 0 })}
            />
          </FormField>
        </div>

      </FormWrapper>
  );
}
