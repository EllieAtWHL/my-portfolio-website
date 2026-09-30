'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';

interface GameStartProps {
  /**
   * Omitted while the game isn't playable in this environment (see
   * isMicrobrewPlayable): Play is then disabled and the name inputs hidden.
   */
  onStartGame?: (playerOneName: string, playerTwoName: string) => void;
}

const linkClassName = 'text-green-600 dark:text-green-400 hover:underline';
const inputClassName =
  'w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600';

const DEFAULT_NAMES = ['Player One', 'Player Two'] as const;

export function GameStart({ onStartGame }: GameStartProps) {
  const [names, setNames] = useState<[string, string]>(['', '']);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onStartGame?.(names[0].trim() || DEFAULT_NAMES[0], names[1].trim() || DEFAULT_NAMES[1]);
  };

  return (
    <div className="text-center py-8">
      {/* Title Section */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          MICROBREW
        </h1>
        <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 font-light">
          A Game of Crafting and Brewing
        </div>
        <p className="max-w-2xl mx-auto mb-4 text-gray-600 dark:text-gray-400">
          Microbrew is a medium-weight worker placement / puzzle game hybrid
          for two players. Run rival breweries: mash malt, arrange your Copper,
          bottle and ferment your beer, then serve it to customers for cash
          and reputation.
        </p>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
          Microbrew was designed by Nigel and Sarah Kennington and Kickstarted
          by{' '}
          <a
            href="https://www.onefreeelephant.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            One Free Elephant
          </a>{' '}
          in May 2019. This is an unofficial fan-made digital version, and
          it isn&apos;t for sale. You can{' '}
          <a
            href="https://www.onefreeelephant.co.uk/Microbrew/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            print and play your own copy or buy the physical game
          </a>
          .
        </p>
      </div>

      {/* Player names + Play button (2-player hot-seat) */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 mb-12">
        {onStartGame && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-3 text-left">
            {DEFAULT_NAMES.map((placeholder, index) => (
              <div key={placeholder}>
                <label
                  htmlFor={`microbrew-player-${index + 1}`}
                  className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                >
                  {placeholder}&apos;s name
                </label>
                <input
                  id={`microbrew-player-${index + 1}`}
                  type="text"
                  maxLength={20}
                  autoComplete="off"
                  placeholder={placeholder}
                  value={names[index]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNames((current) => (index === 0 ? [value, current[1]] : [current[0], value]));
                  }}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!onStartGame}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
          className="inline-flex items-center tracking-wide"
        >
          Play Game
        </Button>
        {!onStartGame && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
        )}
      </form>
    </div>
  );
}
