import SpursSelect from '@/components/spurs-women/SpursSelect';

interface ResultFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ResultFilter({ value, onChange }: ResultFilterProps) {
  return (
    <div className="xl:col-span-1">
      <label htmlFor="result-filter" className="block spurs-text text-xs font-medium mb-1">
        Result
      </label>
      <SpursSelect
        id="result-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="won">Won</option>
        <option value="draw">Draw</option>
        <option value="lost">Lost</option>
      </SpursSelect>
    </div>
  );
}
