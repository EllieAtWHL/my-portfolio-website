import { ReactNode } from 'react';
import { Button } from '@/components/Button';

interface FormModalProps {
  title: string;
  error?: string | null;
  onCancel: () => void;
  onDelete?: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}

export function FormModal({ title, error, onCancel, onDelete, onSubmit, submitLabel, children }: FormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        {error && (
          <div role="alert" className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">{children}</div>
        <div className="flex justify-end space-x-2 mt-6">
          {onDelete && (
            <Button variant="spurs" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="spurs" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="spurs" onClick={onSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
