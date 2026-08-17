'use client';

import { Card as UniversalCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatsIconButton } from './StatsIconButton';

interface GameStartProps {
  onStartGame: () => void;
  onShowStats: () => void;
}

const RELEASES = [
  {
    version: 'v0.4',
    date: '16th August 2026',
    notes: [
      'Rebuilt on React/Next.js as part of the main portfolio site',
      'Redesigned the play area to fit an entire game on screen without scrolling',
      'Fixed a rare edge case where using your last jester once the tavern deck is empty could leave the game stuck without recognising a loss',
    ],
  },
  {
    version: 'v0.3',
    date: '23rd July 2022',
    notes: ['Stats now available', 'Improved styling'],
  },
  {
    version: 'v0.2',
    date: '7th May 2022',
    notes: ['Added ability to undo card selection (still in beta)', 'Improved styling'],
  },
  {
    version: 'v0.1',
    date: '30th April 2022',
    notes: ['Initial build of game'],
  },
];

export function GameStart({ onStartGame, onShowStats }: GameStartProps) {
  return (
    <div className="text-center py-8">
      {/* Title Section */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          REGICIDE
        </h1>
        <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 font-light">
          A Challenging Strategic Card Game
        </div>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
          Regicide is a challenging card game based on a standard 52 card
          deck. Kickstarted by{' '}
          <a
            href="https://www.badgersfrommars.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Badgers From Mars
          </a>{' '}
          in May 2020.
        </p>
      </div>

      {/* Play Button, with the Stats trigger sharing the same row */}
      <div className="grid grid-cols-3 items-center mb-12">
        <div aria-hidden="true" />
        <Button
          variant="primary"
          size="lg"
          onClick={onStartGame}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
          className="justify-self-center inline-flex items-center text-lg tracking-wide px-10 py-4"
        >
          Play Game
        </Button>
        <div className="flex justify-end">
          <StatsIconButton onClick={onShowStats} />
        </div>
      </div>

      {/* Links Section */}
      <div className="max-w-4xl mx-auto mb-12">
        <h3 className="text-2xl font-semibold mb-6 text-center">Learn More & Get Your Copy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UniversalCard
            variant="highlight"
            hover={true}
            clickable={true}
            onClick={() => window.open('https://www.badgersfrommars.com/buy-regicide/', '_blank')}
          >
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8 flex-shrink-0 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
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
            clickable={true}
            onClick={() => window.open('https://www.badgersfrommars.com/regicide/', '_blank')}
          >
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8 flex-shrink-0 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Learn to Play</div>
                <div className="text-gray-600 dark:text-gray-400">Official rules & guide</div>
              </div>
              <span className="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 group-hover:translate-x-2 transition-all text-2xl">→</span>
            </div>
          </UniversalCard>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400">
          I hope you learn to love it as much as I do!
        </p>
      </div>

      {/* Game Roadmap */}
      <div className="max-w-4xl mx-auto mb-12">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Game Roadmap
        </h3>
        <UniversalCard variant="highlight">
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Make more mobile-friendly</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Improve accessibility</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Include a way of teaching new players how to play</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Option to restart (with same starting cards)</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Resign option</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span>Multi-player support</span>
            </li>
          </ul>
        </UniversalCard>
      </div>

      {/* Version History */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Version History
        </h3>
        <UniversalCard variant="highlight" padding="sm" className="text-left">
          {RELEASES.map((release, index) => (
            <details
              key={release.version}
              open={index === 0}
              className={`group ${index > 0 ? 'border-t border-gray-200 dark:border-dark-accent/20' : ''}`}
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none py-2 font-semibold [&::-webkit-details-marker]:hidden">
                <span>{release.date} - Release {release.version}</span>
                <svg
                  className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400 pb-3">
                {release.notes.map((note) => (
                  <li key={note} className="flex items-baseline gap-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">▸</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </UniversalCard>
      </div>
    </div>
  );
}
