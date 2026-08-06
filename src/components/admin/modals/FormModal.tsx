import { ReactNode, useId } from 'react';
import { Button } from '@/components/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const titleId = useId();
  // FormModal is only ever mounted while shown (parents render it as
  // `{show && <FormModal ... />}`), so there's no isOpen prop - the trap
  // is simply active for the component's whole lifetime.
  const containerRef = useFocusTrap<HTMLDivElement>(true, onCancel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h3 id={titleId} className="text-xl font-bold text-white mb-4">{title}</h3>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm" role="alert">
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
