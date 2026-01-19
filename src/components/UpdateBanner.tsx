'use client';

import { useState } from 'react';

export default function UpdateBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900 border-b border-amber-300 dark:border-amber-700 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-amber-600 dark:text-amber-400" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 dark:text-amber-200">
                <span className="font-medium">Spurs Women section</span> is currently being updated with more data and content. 
                Some information may be incomplete while we work to make it comprehensive.
              </p>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 bg-amber-100 dark:bg-amber-900 rounded-md p-1 hover:bg-amber-200 dark:hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              aria-label="Dismiss"
            >
              <svg 
                className="h-4 w-4 text-amber-600 dark:text-amber-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
