'use client';

import { useState } from 'react';
import London2012Sidebar from './London2012Sidebar';
import CalendarIcon from './CalendarIcon';

interface London2012LayoutProps {
  children: React.ReactNode;
  date?: string;
  dateTime?: string;
}

export default function London2012Layout({ children, date, dateTime }: London2012LayoutProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <div className="content-with-footer min-h-screen bg-pale-green dark:bg-third-colour">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Accordion Navigation */}
        <div className="lg:hidden -mt-4">
          <button
            onClick={() => setIsNavigationOpen(!isNavigationOpen)}
            className="w-full flex items-center justify-between p-4 mobile-nav-button rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-brand-primary-dark dark:text-dark-text">
                My Olympic Journey
              </h3>
              <span className="text-sm text-neutral-gray dark:text-dark-gray-medium">Navigation</span>
            </div>
            <svg
              className="w-5 h-5 text-brand-primary-dark dark:text-dark-text transition-transform duration-200"
              style={{ transform: isNavigationOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Collapsible Navigation Content */}
          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isNavigationOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="p-4 bg-white dark:bg-dark-bg-1 rounded-b-lg border-x border-b border-brand-primary-dark dark:border-dark-accent mobile-sidebar-content">
              <London2012Sidebar showHeader={false} />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-1/4 lg:fixed lg:left-0 lg:top-20 lg:h-screen lg:border-r lg:border-pale-green dark:lg:border-third-colour lg:pr-4 lg:py-8 lg:pl-6">
          <div className="lg:sticky lg:top-0">
            <London2012Sidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full lg:w-3/4 lg:ml-[25%] lg:pl-8 p-4 pb-32 lg:p-6">
          <div className="max-w-4xl mx-auto mb-48">
            {/* Date with icon - only show if date is provided */}
            {date && dateTime && (
              <div className="flex items-center gap-2 mb-6">
                <CalendarIcon />
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime={dateTime}>
                  {date}
                </time>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
