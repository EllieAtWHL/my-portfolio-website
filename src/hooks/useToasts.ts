'use client';

import { useCallback, useRef, useState } from 'react';

export type ToastTone = 'info' | 'error';

export interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  duration: number;
}

const DEFAULT_DURATION = 3000;

// Mirrors the original vanilla-JS Toast class's behaviour: each call stacks a
// new, independently auto-dismissing notification rather than replacing a
// single status message (myPortfolioWebsite/scripts/toast.js).
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((text: string, tone: ToastTone = 'info', duration = DEFAULT_DURATION) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, text, tone, duration }]);
  }, []);

  return { toasts, push, dismiss };
}
