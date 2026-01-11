'use client';

import { useState } from 'react';
import { Card as UniversalCard } from '@/components/Card';

interface GameStartProps {
  onStartGame: () => void;
  onShowStats: () => void;
}

export function GameStart({ onStartGame, onShowStats }: GameStartProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="text-center py-8">
      {/* Title Section */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          REGICIDE
        </h1>
        <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 font-light">
          A Challenging Strategic Card Game
        </div>
      </div>

      {/* Stats Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={onShowStats}
          className="button secondary"
          aria-label="View Statistics"
        >
          📊 Statistics
        </button>
      </div>

      {/* Play Button */}
      <div className="text-center mb-12">
        <button
          onClick={onStartGame}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            button primary text-xl px-8 py-4
            transform transition-all duration-300
            hover:scale-105 active:scale-95
            ${isHovered ? 'translate-y-[-2px]' : ''}
          `}
        >
          <span className="flex items-center gap-3">
            <span className="text-xl">👑</span>
            PLAY GAME
            <span className="text-xl">⚔️</span>
          </span>
        </button>
      </div>

      {/* Links Section */}
      <div className="max-w-4xl mx-auto mb-12">
        <h3 className="text-2xl font-semibold mb-6 text-center">Learn More & Get Your Copy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UniversalCard 
            variant="highlight"
            hover={true}
            onClick={() => window.open('https://www.badgersfrommars.com/buy-regicide/', '_blank')}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🛒</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Buy Physical Copy</div>
                <div className="text-gray-600 dark:text-gray-400">Support creators</div>
              </div>
              <span className="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 group-hover:translate-x-2 transition-all text-2xl">→</span>
            </div>
          </UniversalCard>
          
          <UniversalCard 
            variant="highlight"
            hover={true}
            onClick={() => window.open('https://www.badgersfrommars.com/regicide/', '_blank')}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Learn to Play</div>
                <div className="text-gray-600 dark:text-gray-400">Official rules & guide</div>
              </div>
              <span className="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 group-hover:translate-x-2 transition-all text-2xl">→</span>
            </div>
          </UniversalCard>
        </div>
      </div>

      {/* Game Roadmap */}
      <div className="max-w-4xl mx-auto mb-12">
        <UniversalCard variant="highlight">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
            <span className="text-xl">🗺️</span>
            Game Roadmap
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Make more mobile-friendly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Improve accessibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Include a way of teaching new players how to play</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Option to restart (with same starting cards)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Resign option</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">▸</span>
              <span>Multi-player support</span>
            </li>
          </ul>
        </UniversalCard>
      </div>

      {/* Version History */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-xl">📋</span>
          Version History
        </h3>
        <div className="space-y-4">
          <UniversalCard variant="highlight">
            <h4 className="font-semibold mb-2">23rd July 2022 - Release v0.3</h4>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Release notes</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1 text-sm">▸</span>
                <span>Stats now available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1 text-sm">▸</span>
                <span>Improved styling</span>
              </li>
            </ul>
          </UniversalCard>
          
          <UniversalCard variant="highlight">
            <h4 className="font-semibold mb-2">7th May 2022 - Release v0.2</h4>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Release notes</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1 text-sm">▸</span>
                <span>Added ability to undo card selection (still in beta)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1 text-sm">▸</span>
                <span>Improved styling</span>
              </li>
            </ul>
          </UniversalCard>
          
          <UniversalCard variant="highlight">
            <h4 className="font-semibold mb-2">30th April 2022 - Release v0.1</h4>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Release Notes</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1 text-sm">▸</span>
                <span>Initial build of game</span>
              </li>
            </ul>
          </UniversalCard>
        </div>
      </div>
    </div>
  );
}
