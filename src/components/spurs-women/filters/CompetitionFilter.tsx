'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Match } from '@/lib/data/matches';

interface CompetitionFilterProps {
  matches: Match[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CompetitionFilter({ matches, value, onChange }: CompetitionFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const competitions = useMemo(() => {
    const uniqueCompetitions = [...new Set(matches.map(match => match.competitions?.name).filter(Boolean))];
    return uniqueCompetitions.sort();
  }, [matches]);

  // Update dropdown position on scroll
  useEffect(() => {
    if (!isDropdownOpen || !dropdownRef.current || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current && dropdownRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        dropdownRef.current.style.top = `${rect.bottom + window.scrollY + 4}px`;
        dropdownRef.current.style.left = `${rect.left + window.scrollX}px`;
      }
    };

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll);
    updatePosition(); // Initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDropdownOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="lg:col-span-2 xl:col-span-1">
      {/* Not a <label>: pairs with a role="button" div below, not a native form control - associated via aria-labelledby instead */}
      <span id="competition-filter-label" className="block spurs-text text-xs font-medium mb-1">
        Competition
      </span>
      <div className="relative">
        <div
          ref={triggerRef}
          className="w-full px-2 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-labelledby="competition-filter-label"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            } else if (e.key === 'Escape' && isDropdownOpen) {
              setIsDropdownOpen(false);
            }
          }}
        >
          <div className="flex justify-between items-center">
            <span>
              {value.length === 0
                ? 'All'
                : value.length === 1
                  ? value[0]
                  : `${value.length} selected`
              }
            </span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div
          ref={dropdownRef}
          className={`fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 ${isDropdownOpen ? 'block' : 'hidden'}`}
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '200px'
          }}
        >
          <div className="p-2">
            <label className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={value.length === 0}
                onChange={(e) => {
                  e.stopPropagation();
                  if (e.target.checked) {
                    onChange([]);
                  }
                }}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-white">All</span>
            </label>
            {competitions.map(competition => (
              <label key={competition || 'unknown'} className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.includes(competition || 'unknown')}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checkboxValue = competition || 'unknown';
                    if (e.target.checked) {
                      onChange([...value.filter(c => c !== 'unknown'), checkboxValue]);
                    } else {
                      onChange(value.filter(c => c !== checkboxValue));
                    }
                  }}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-white">
                  {(competition && competition.length > 20) ? competition.substring(0, 17) + '...' : competition || 'Unknown'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
