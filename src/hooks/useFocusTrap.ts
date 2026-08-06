'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard dialog focus behaviour: moves focus into the container when it
 * opens, traps Tab/Shift+Tab inside it, closes on Escape, and restores focus
 * to whatever was focused before it opened when it closes/unmounts. Pass a
 * constant `true` for `isOpen` from components that are only ever mounted
 * while open (e.g. modals rendered via `{show && <Modal />}`).
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const initialFocusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (initialFocusable?.[0] ?? container)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !container) return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return containerRef;
}
