import type { Stadium } from '@/types/spurs-women-admin';

interface StadiumsTableProps {
  stadiums: Stadium[];
  onSelect: (stadium: Stadium) => void;
}

export function StadiumsTable({ stadiums, onSelect }: StadiumsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left p-2 spurs-text">Name</th>
            <th className="text-left p-2 spurs-text">City</th>
            <th className="text-left p-2 spurs-text">Capacity</th>
          </tr>
        </thead>
        <tbody>
          {stadiums.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-2 text-center text-gray-400">
                No stadiums found
              </td>
            </tr>
          ) : (
            stadiums.map(stadium => (
              <tr
                key={stadium.id}
                className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => onSelect(stadium)}
              >
                <td className="p-2 spurs-text">{stadium.name}</td>
                <td className="p-2 spurs-text">{stadium.city || '-'}</td>
                <td className="p-2 spurs-text">{stadium.capacity || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
