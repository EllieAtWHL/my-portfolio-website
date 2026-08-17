'use client';

import { useEffect, useState } from 'react';
import type { ToastTone } from '@/hooks/useToasts';

interface ToastProps {
  text: string;
  tone: ToastTone;
  duration: number;
  onDismiss: () => void;
}

// A single stacked, auto-dismissing notification - the React port of
// myPortfolioWebsite/scripts/toast.js + styles/toast.css: slide in from the
// right, deplete a progress bar over `duration`, dismiss on click or once
// the timer runs out. Colours use this site's own green palette rather than
// Tailwind's default gray/blue (see feedback_regicide_design_taste memory).
export function Toast({ text, tone, duration, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [progressStarted, setProgressStarted] = useState(false);

  useEffect(() => {
    const showFrame = requestAnimationFrame(() => {
      setVisible(true);
      setProgressStarted(true);
    });
    const autoCloseTimeout = setTimeout(handleDismiss, duration);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(autoCloseTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 250);
  }

  const toneClasses =
    tone === 'error'
      ? 'bg-red-600 dark:bg-red-700 border-red-700 dark:border-red-800 text-white'
      : 'bg-[var(--bg-light-1)] dark:bg-[var(--dark-bg-1)] border-[var(--brand-primary-dark)] dark:border-[var(--dark-accent)] text-[var(--brand-primary-dark)] dark:text-[var(--dark-accent)]';

  const progressClasses = tone === 'error' ? 'bg-white/70' : 'bg-[var(--brand-primary-dark)] dark:bg-[var(--dark-accent)]';

  return (
    <button
      type="button"
      onClick={handleDismiss}
      className={`
        relative overflow-hidden cursor-pointer rounded-md border shadow-lg text-left
        pl-4 pr-7 py-3 transition-transform duration-[250ms] ease-in-out
        ${visible ? 'translate-x-0' : 'translate-x-[110%]'}
        ${toneClasses}
      `}
    >
      <p className="text-sm font-medium leading-snug">{text}</p>
      <span aria-hidden="true" className="absolute top-2 right-2.5 text-base leading-none opacity-70">
        &times;
      </span>
      <div
        aria-hidden="true"
        className={`absolute bottom-0 left-0 h-0.5 ${progressClasses}`}
        style={{
          width: progressStarted ? '0%' : '100%',
          transitionProperty: 'width',
          transitionTimingFunction: 'linear',
          transitionDuration: `${duration}ms`,
        }}
      />
    </button>
  );
}
