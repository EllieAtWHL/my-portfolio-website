import { Button } from '@/components/Button';
import { ReactNode } from 'react';

interface FormWrapperProps {
  title: string;
  isEditMode: boolean;
  editingId: string | number | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  children: ReactNode;
  submitButtonText?: string;
  editSubmitButtonText?: string;
}

export function FormWrapper({
  title,
  isEditMode,
  editingId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
  children,
  submitButtonText,
  editSubmitButtonText,
}: FormWrapperProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isEditMode && editingId ? `Edit ${title}` : `Add New ${title}`}
        </h2>
        {isEditMode && editingId && (
          <div className="flex gap-2">
            {onDelete && (
              <Button
                variant="spurs"
                size="sm"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            {onCancel && (
              <Button
                variant="spurs"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {children}
        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading 
            ? (isEditMode ? 'Updating...' : 'Creating...') 
            : (isEditMode ? (editSubmitButtonText || `Update ${title}`) : (submitButtonText || `Create ${title}`))
          }
        </Button>
      </form>
    </div>
  );
}
