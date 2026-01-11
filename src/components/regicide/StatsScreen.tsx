'use client';

import { useState, useEffect } from 'react';
import { Card as UniversalCard } from '@/components/Card';

interface StatsScreenProps {
  onClose: () => void;
}

interface GameStats {
  gamesStarted: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  lastPlayed: string;
  totalPlayTime: number;
}

export function StatsScreen({ onClose }: StatsScreenProps) {
  const [stats, setStats] = useState<GameStats>({
    gamesStarted: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    lastPlayed: 'Never',
    totalPlayTime: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      const savedStats = localStorage.getItem('regicide-stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats({
          ...parsed,
          winRate: parsed.gamesStarted > 0 ? Math.round((parsed.gamesWon / parsed.gamesStarted) * 100) : 0
        });
      }
    };

    loadStats();
  }, []);

  const resetStats = () => {
    const defaultStats = {
      gamesStarted: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      lastPlayed: 'Never',
      totalPlayTime: 0
    };
    
    localStorage.setItem('regicide-stats', JSON.stringify(defaultStats));
    setStats(defaultStats);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <UniversalCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold">Game Statistics</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Close statistics"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Games Played */}
            <UniversalCard padding="sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Games Started</span>
                <span className="text-2xl font-bold">{stats.gamesStarted}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.gamesStarted * 10, 100)}%` }}
                />
              </div>
            </UniversalCard>

            {/* Games Won */}
            <UniversalCard padding="sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Games Won</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.gamesWon}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.gamesStarted > 0 ? (stats.gamesWon / stats.gamesStarted) * 100 : 0}%` }}
                />
              </div>
            </UniversalCard>

            {/* Games Lost */}
            <UniversalCard padding="sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Games Lost</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.gamesLost}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-red-600 dark:bg-red-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.gamesStarted > 0 ? (stats.gamesLost / stats.gamesStarted) * 100 : 0}%` }}
                />
              </div>
            </UniversalCard>

            {/* Win Rate */}
            <UniversalCard padding="sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Win Rate</span>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.winRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
            </UniversalCard>
          </div>

          {/* Additional Info */}
          <UniversalCard padding="sm" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 dark:text-gray-300 text-sm block">Last Played</span>
                <span className="font-semibold">{stats.lastPlayed}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300 text-sm block">Total Play Time</span>
                <span className="font-semibold">{Math.round(stats.totalPlayTime / 60)} minutes</span>
              </div>
            </div>
          </UniversalCard>

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              onClick={resetStats}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold
                       hover:bg-red-700 transform transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg"
            >
              Reset Statistics
            </button>
          </div>
        </div>
      </UniversalCard>
    </div>
  );
}
