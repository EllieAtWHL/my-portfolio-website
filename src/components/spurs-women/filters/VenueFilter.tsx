import SpursSelect from '@/components/spurs-women/SpursSelect';

interface VenueFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function VenueFilter({ value, onChange }: VenueFilterProps) {
  return (
    <div className="xl:col-span-1">
      <label htmlFor="venue-filter" className="block spurs-text text-xs font-medium mb-1">
        Home/Away
      </label>
      <SpursSelect
        id="venue-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="home">Home</option>
        <option value="away">Away</option>
        <option value="neutral">Neutral</option>
      </SpursSelect>
    </div>
  );
}
