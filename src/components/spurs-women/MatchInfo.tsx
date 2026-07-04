import { Card } from '@/components/Card';
import ReactMarkdown from 'react-markdown';

type MatchInfoProps = {
  stadium_display_name?: string | null;
  stadium_slug?: string | null;
  attendance?: number | null;
  notes?: string | null;
  date?: string | null;
  kickoff_time?: string | null;
};

export default function MatchInfo({ stadium_display_name, stadium_slug, attendance, notes, date, kickoff_time }: MatchInfoProps) {
  if (!stadium_display_name && !attendance && !notes && !date) return null;

  const formatKickoffDateTime = (date: string, time: string | null) => {
    const dateObj = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes));
    }
    return dateObj.toLocaleString([], { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(time && { hour: 'numeric', minute: '2-digit', hour12: true })
    });
  };

  return (
    <Card variant="spursAccent" padding="md" hover={false}>
      <div className="mb-6">
        {date && (
          <p className="mb-2">
            <strong>Kickoff:</strong> {formatKickoffDateTime(date, kickoff_time || null)}
          </p>
        )}
        {stadium_display_name && (
          <p className="mb-2">
            <strong>Venue:</strong>{' '}
            {stadium_display_name === 'Behind-Closed-Doors' ? (
              <span className="spurs-text">{stadium_display_name}</span>
            ) : stadium_slug ? (
              <a
                href={`/spurs-women/stadiums/${stadium_slug}`}
                className="venue-link spurs-text underline decoration-2 hover:opacity-80"
              >
                {stadium_display_name}
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stadium_display_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="venue-link spurs-text underline decoration-2 hover:opacity-80"
              >
                {stadium_display_name}
              </a>
            )}
          </p>
        )}
        {attendance && <p className="mb-2"><strong>Attendance:</strong> {attendance.toLocaleString()}</p>}
        {notes && (
          <div>
            <strong>Notes:</strong>
            <div className="prose prose-sm mt-3">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
