'use client';

import { Button } from '@/components/Button';

interface GameStartProps {
  /** Omitted until the game engine is wired up; the Play button is disabled without it. */
  onStartGame?: () => void;
}

const linkClassName = 'text-green-600 dark:text-green-400 hover:underline';

export function GameStart({ onStartGame }: GameStartProps) {
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

      {/* Play Button */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <Button
          variant="primary"
          size="lg"
          onClick={onStartGame}
          disabled={!onStartGame}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
          className="inline-flex items-center text-lg tracking-wide px-10 py-4"
        >
          Play Game
        </Button>
        {!onStartGame && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
        )}
      </div>
    </div>
  );
}
