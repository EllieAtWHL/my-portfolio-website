'use client';

import { Toast } from './Toast';
import type { ToastItem } from '@/hooks/useToasts';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

// Fixed top-right stack, matching the original's default Toast position
// ("top-right" in myPortfolioWebsite/scripts/toast.js's DEFAULT_OPTIONS).
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-24 right-4 z-[110] flex w-[calc(100vw-2rem)] max-w-xs flex-col gap-2 sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          text={toast.text}
          tone={toast.tone}
          duration={toast.duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
