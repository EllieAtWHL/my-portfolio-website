import { Button } from '@/components/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Showing {start} to {end} of {totalItems} {itemLabel}
      </div>
      <div className="flex space-x-2">
        <Button
          variant="spurs"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="px-3 py-1 text-sm text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="spurs"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
