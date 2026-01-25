import { Card } from '@/components/Card';

type MatchInfoProps = {
  venue?: string | null;
  attendance?: number | null;
  notes?: string | null;
  date?: string | null;
  kickoff_time?: string | null;
};

export default function MatchInfo({ venue, attendance, notes, date, kickoff_time }: MatchInfoProps) {
  if (!venue && !attendance && !notes && !date) return null;

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
        {venue && (
          <p className="mb-2">
            <strong>Venue:</strong>{' '}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="venue-link spurs-text underline decoration-2 hover:opacity-80"
            >
              {venue}
            </a>
          </p>
        )}
        {attendance && <p className="mb-2"><strong>Attendance:</strong> {attendance.toLocaleString()}</p>}
        {notes && <p><strong>Notes:</strong> {notes}</p>}
      </div>
    </Card>
  );
}
