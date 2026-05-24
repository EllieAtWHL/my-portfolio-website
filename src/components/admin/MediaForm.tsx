import { Button } from '@/components/Button';

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
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isMediaEditMode && editingMediaId ? 'Edit Media' : 'Add New Media'}
        </h2>
        {isMediaEditMode && editingMediaId && (
          <div className="flex gap-2">
            <Button
              variant="spurs"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              variant="spurs"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Season Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-season">Season <span className="text-gray-400">(optional)</span></label>
            <select
              id="media-season"
              value={mediaSeason}
              onChange={(e) => setMediaSeason(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            >
              <option value="">All seasons</option>
              {(() => {
                const seasonIdsInMatches = [...new Set(matches.map(m => m.season_id))];
                return seasons.filter(season => seasonIdsInMatches.includes(season.id)).map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ));
              })()}
            </select>
          </div>
          
          {/* Match Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-match">Match <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="media-match"
              value={mediaForm.match_id || ''}
              onChange={(e) => setMediaForm({ ...mediaForm, match_id: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="">Select match</option>
              {matches.filter(match => !mediaSeason || match.season_id === mediaSeason).map(match => {
                const homeTeam = teams.find(t => t.id === match.home_team_id);
                const awayTeam = teams.find(t => t.id === match.away_team_id);
                const competition = competitions.find(c => c.id === match.competition_id);
                
                return (
                  <option key={match.id} value={match.id}>
                    {homeTeam?.short_name} vs {awayTeam?.short_name} - {competition?.nickname} ({match.date})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-type">Media Type <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="media-type"
              value={mediaForm.type || 'social media'}
              onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value as MediaForm['type'] })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            >
              <option value="social media">Social Media</option>
              <option value="article">Article</option>
              <option value="photo">Photo</option>
              <option value="photo album">Photo Album</option>
              <option value="video-external">External Video</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-title">Title <span className="text-gray-400">(optional)</span></label>
            <input
              id="media-title"
              type="text"
              value={mediaForm.title || ''}
              onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-url">URL <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="media-url"
              type="text"
              value={mediaForm.url || ''}
              onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              required
              aria-required="true"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="media-sort-order">Sort Order <span className="text-gray-400">(optional)</span></label>
            <input
              id="media-sort-order"
              type="number"
              value={mediaForm.sort_order || 0}
              onChange={(e) => setMediaForm({ ...mediaForm, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isMediaEditMode ? 'Updating...' : 'Creating...') : (isMediaEditMode ? 'Update Media' : 'Create Media')}
        </Button>
      </form>
    </div>
  );
}
