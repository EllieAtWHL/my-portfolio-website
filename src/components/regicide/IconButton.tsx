'use client';

import type { ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

// Icon-only trigger matching the original site's #stats-icon (a small,
// low-opacity glyph in an outlined circle, not a filled button) - see
// myPortfolioWebsite/regicide/regicide.css. Shared by the stats and rules
// triggers so they always look identical side by side.
// Deliberately a raw <button>, not the shared Button component: Button always
// carries filled background/padding styling, which is exactly what this
// control is meant to avoid. Noted as intentional in reference/BUTTON_MIGRATION.md.
export function IconButton({ onClick, label, children, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 rounded-full border border-brand-dark text-brand-dark opacity-50 hover:opacity-100 focus-visible:opacity-100 dark:bg-dark-bg-1 dark:border-dark-gray-medium/40 dark:text-dark-gray-medium dark:opacity-100 dark:hover:border-dark-accent dark:hover:text-dark-accent dark:focus-visible:border-dark-accent dark:focus-visible:text-dark-accent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark dark:focus-visible:ring-dark-accent focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}
