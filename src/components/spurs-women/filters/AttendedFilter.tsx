import SpursSelect from '@/components/spurs-women/SpursSelect';

interface AttendedFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function AttendedFilter({ value, onChange }: AttendedFilterProps) {
  return (
    <div className="xl:col-span-1">
      <label htmlFor="attended-filter" className="block spurs-text text-xs font-medium mb-1">
        Attended
      </label>
      <SpursSelect
        id="attended-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="attended">Attended</option>
        <option value="not-attended">Not Attended</option>
      </SpursSelect>
    </div>
  );
}
