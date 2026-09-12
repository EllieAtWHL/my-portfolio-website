'use client';

import React, { forwardRef } from 'react';

interface SpursSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const SpursSelect = forwardRef<HTMLSelectElement, SpursSelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-2 py-1.5 text-sm
          bg-[var(--spurs-input-bg)] text-[var(--spurs-input-text)] border border-[var(--spurs-input-border)]
          rounded-md focus:outline-none focus:ring-2
          focus:ring-[var(--spurs-input-focus-ring)] focus:border-[var(--spurs-input-focus-ring)]
          hover:bg-[var(--spurs-input-hover-bg)] transition-colors duration-200
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

SpursSelect.displayName = 'SpursSelect';

export default SpursSelect;
