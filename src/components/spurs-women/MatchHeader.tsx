type MatchHeaderProps = {
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
  homeScore: number;
  awayScore: number;
  attended: boolean;
  competition?: {
    name: string;
    icon_svg?: string;
  } | null;
};

export default function MatchHeader({ home_team, away_team, homeScore, awayScore, attended, competition }: MatchHeaderProps) {
  return (
    <div className="mb-4">
      {competition && (
        <div className="flex items-center gap-2 mb-3">
          {competition.icon_svg ? (
            <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: competition.icon_svg }} />
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
            </svg>
          )}
          <span className="text-lg font-semibold">{competition.name}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
        <h1 className="spurs-text font-bold flex items-center gap-2 sm:gap-4 flex-wrap">
          <span>
            {home_team.name}
          </span>
          <span className="text-gray-500">{homeScore} - {awayScore}</span>
          <span>
            {away_team.name}
          </span>
        </h1>
        {attended && (
          <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M6 5C4.89543 5 4 5.89543 4 7V8.17071C4 8.70201 4.21071 9.21157 4.58579 9.58664L5 10.0009V14.0009L4.58579 14.4151C4.21071 14.7902 4 15.2997 4 15.831V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V15.831C20 15.2997 19.7893 14.7902 19.4142 14.4151L19 14.0009V10.0009L19.4142 9.58664C19.7893 9.21157 20 8.70201 20 8.17071V7C20 5.89543 19.1046 5 18 5H6ZM10 7C10.5523 7 11 7.44772 11 8V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V8C9 7.44772 9.44772 7 10 7Z" />
            </svg>
            Attended
          </div>
        )}
      </div>
    </div>
  );
}
//TODO: Can we fix the H1 so the team names aren't so large!
