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
          bg-gray-800 text-white border border-gray-600 
          rounded-md focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:border-blue-500
          hover:bg-gray-700 transition-colors duration-200
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
