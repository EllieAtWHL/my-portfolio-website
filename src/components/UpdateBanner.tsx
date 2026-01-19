'use client';

import { useState } from 'react';

interface BannerProps {
  message: string;
  highlightedText?: string;
  type?: 'warning' | 'info' | 'success' | 'notice';
  dismissible?: boolean;
  className?: string;
}

const bannerStyles = {
  warning: {
    container: 'bg-amber-100 dark:bg-amber-900 border-b border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    button: 'bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 focus:ring-amber-500 dark:focus:ring-amber-400',
    iconPath: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
  },
  info: {
    container: 'bg-blue-100 dark:bg-blue-900 border-b border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    button: 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 focus:ring-blue-500 dark:focus:ring-blue-400',
    iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
  },
  success: {
    container: 'bg-green-100 dark:bg-green-900 border-b border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-400',
    button: 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 focus:ring-green-500 dark:focus:ring-green-400',
    iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
  },
  notice: {
    container: 'bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
    icon: 'text-gray-600 dark:text-gray-400',
    button: 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 focus:ring-gray-500 dark:focus:ring-gray-400',
    iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
  }
};

export default function UpdateBanner({ 
  message, 
  highlightedText, 
  type = 'warning', 
  dismissible = true, 
  className = '' 
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styles = bannerStyles[type];

  return (
    <div className={`${styles.container} ${className} rounded-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg 
                className={`h-5 w-5 ${styles.icon}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d={styles.iconPath}
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${styles.text}`}>
                {highlightedText ? (
                  <>
                    <span className="font-medium">{highlightedText}</span> {message}
                  </>
                ) : (
                  message
                )}
              </p>
            </div>
          </div>
          {dismissible && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className={`flex-shrink-0 ${styles.button} rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                aria-label="Dismiss"
              >
                <svg 
                  className={`h-4 w-4 ${styles.icon}`} 
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
          )}
        </div>
      </div>
    </div>
  );
}
