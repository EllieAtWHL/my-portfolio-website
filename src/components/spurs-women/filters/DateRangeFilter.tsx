interface DateRangeFilterProps {
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function DateRangeFilter({ fromValue, toValue, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="lg:col-span-2 xl:col-span-2">
      {/* Not a <label>: heads a group of two inputs (From/To below), not a single control */}
      <span className="block spurs-text text-xs font-medium mb-1">
        Date Range
      </span>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="date-from-filter" className="block spurs-text text-xs font-medium mb-1 opacity-75">
            From
          </label>
          <input
            id="date-from-filter"
            type="date"
            value={fromValue}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200"
            style={{
              WebkitTextFillColor: 'white',
              color: 'white'
            }}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="date-to-filter" className="block spurs-text text-xs font-medium mb-1 opacity-75">
            To
          </label>
          <input
            id="date-to-filter"
            type="date"
            value={toValue}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200"
            style={{
              WebkitTextFillColor: 'white',
              color: 'white'
            }}
          />
        </div>
      </div>
    </div>
  );
}
