'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useGroundhopperGame } from '@/hooks/useGroundhopperGame';
import {
  HINT_SCORE_CAP,
  MAX_ROUND_SCORE,
  dayNumber,
  formatDistance,
  shareText,
  type GroundhopperStadium,
} from '@/lib/groundhopper';
import GroundhopperMap from './GroundhopperMap';

interface GroundhopperGameProps {
  stadiums: GroundhopperStadium[];
}

function stadiumFacts(stadium: GroundhopperStadium): string[] {
  const facts: string[] = [];
  const place = [stadium.city, stadium.country].filter(Boolean).join(', ');
  if (place) facts.push(place);
  if (stadium.capacity) facts.push(`Capacity ${stadium.capacity.toLocaleString('en-GB')}`);
  if (stadium.openedYear) facts.push(`Opened ${stadium.openedYear}`);
  return facts;
}

function RoundPips({ total, scores, current }: { total: number; scores: number[]; current: number }) {
  return (
    <ol className="groundhopper-pips" aria-label="Round scores">
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          className={`groundhopper-pip${i < scores.length ? ' is-done' : ''}${i === current ? ' is-current' : ''}`}
          aria-label={i < scores.length ? `Ground ${i + 1}: ${scores[i]} points` : `Ground ${i + 1}: not played`}
        >
          {i < scores.length ? scores[i] : i + 1}
        </li>
      ))}
    </ol>
  );
}

export default function GroundhopperGame({ stadiums }: GroundhopperGameProps) {
  const game = useGroundhopperGame(stadiums);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (game.rounds.length === 0) {
    return (
      <Card variant="spursAccent" hover={false}>
        <p className="spurs-text text-center">No grounds are ready to play yet - check back soon.</p>
      </Card>
    );
  }

  const scores = game.results.map(r => r.score);
  const maxScore = game.rounds.length * MAX_ROUND_SCORE;
  const shareUrl = `${window.location.origin}/spurs-women/groundhopper`;

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText(game.dateKey, game.results, shareUrl));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  if (game.phase === 'finished') {
    return (
      <div className="groundhopper-summary">
        <Card variant="spursAccent" hover={false}>
          <div className="groundhopper-eyebrow">Groundhopper #{dayNumber(game.dateKey)}</div>
          <div className="groundhopper-total">
            {game.totalScore}
            <span className="groundhopper-total-max">/{maxScore}</span>
          </div>
          <p className="spurs-text text-sm opacity-75">
            Streak {game.streak} {game.streak === 1 ? 'day' : 'days'} · Best {game.bestStreak}
          </p>
          <RoundPips total={game.rounds.length} scores={scores} current={-1} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="spurs" size="sm" onClick={copyResult}>
              Copy result
            </Button>
            <span className="text-sm spurs-text" role="status">
              {copyState === 'copied' && 'Copied - no spoilers included.'}
              {copyState === 'failed' && 'Couldn’t copy - select the text below instead.'}
            </span>
          </div>
          {copyState === 'failed' && (
            <pre className="groundhopper-share-fallback">{shareText(game.dateKey, game.results, shareUrl)}</pre>
          )}
        </Card>

        <ol className="groundhopper-summary-list">
          {game.rounds.map((stadium, i) => {
            const result = game.results[i];
            return (
              <li key={stadium.id}>
                <Card variant="spursAccent" padding="sm" hover={false}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/spurs-women/stadiums/${stadium.slug}`} className="spurs-text font-semibold underline-offset-2 hover:underline">
                        {stadium.name}
                      </Link>
                      {stadium.currentName && <p className="spurs-text text-xs opacity-75">Now {stadium.currentName}</p>}
                      <p className="spurs-text text-xs opacity-75">{stadiumFacts(stadium).join(' · ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="groundhopper-round-score">{result.score}</div>
                      <p className="spurs-text text-xs opacity-75">
                        {formatDistance(result.distanceKm)}
                        {result.hintUsed ? ' · hint' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
        <p className="spurs-text text-center text-sm opacity-75">Five new grounds tomorrow.</p>
      </div>
    );
  }

  const stadium = game.currentStadium!;
  const result = game.currentResult;
  const isLastRound = game.roundIndex === game.rounds.length - 1;

  return (
    <div className="groundhopper-layout">
      <Card variant="spursAccent" padding="sm" hover={false} className="groundhopper-panel">
        <div className="flex items-center justify-between gap-3">
          <div className="groundhopper-eyebrow">
            Ground {game.roundIndex + 1} of {game.rounds.length}
          </div>
          <div className="groundhopper-eyebrow">{game.totalScore} pts</div>
        </div>
        <h2 className="groundhopper-stadium-name">{stadium.name}</h2>

        {game.phase === 'guessing' ? (
          game.hintUsed ? (
            <p className="spurs-text text-sm">
              It&apos;s in <strong>{stadium.city ?? 'an unlisted city'}</strong>
              <span className="opacity-75"> · worth up to {HINT_SCORE_CAP}</span>
            </p>
          ) : (
            stadium.city && (
              <Button variant="ghost" size="xs" className="groundhopper-hint-button" onClick={game.revealHint}>
                Show the city (max {HINT_SCORE_CAP} points)
              </Button>
            )
          )
        ) : (
          result && (
            <>
              <p className="groundhopper-result" role="status">
                <span className="groundhopper-round-score">{result.score}</span>
                <span className="spurs-text text-sm"> points · {formatDistance(result.distanceKm)} away</span>
              </p>
              {stadium.currentName && <p className="spurs-text text-xs opacity-75">Now {stadium.currentName}</p>}
              <p className="spurs-text text-xs opacity-75">{stadiumFacts(stadium).join(' · ')}</p>
            </>
          )
        )}
      </Card>

      <GroundhopperMap
        guess={result ? result.guess : game.pendingGuess}
        answer={result ? stadium : null}
        interactive={game.phase === 'guessing'}
        onGuess={game.placeGuess}
        roundKey={game.roundIndex}
      />

      {/* Below the map on phones (so the button is next to where you just
          tapped), under the panel in the side column on desktop. */}
      <div className="groundhopper-actions">
        {game.phase === 'guessing' ? (
          <>
            <p className="spurs-text text-sm opacity-75" role="status">
              {game.pendingGuess ? 'Pin dropped. Tap again to move it, or lock it in.' : 'Tap the map where you think it is.'}
            </p>
            <Button variant="spurs" fullWidth className="mt-2" disabled={!game.pendingGuess} onClick={game.submitGuess}>
              Lock in guess
            </Button>
          </>
        ) : (
          <Button variant="spurs" fullWidth onClick={game.nextRound}>
            {isLastRound ? 'See today\u2019s results' : 'Next ground'}
          </Button>
        )}
        <RoundPips total={game.rounds.length} scores={scores} current={game.roundIndex} />
      </div>
    </div>
  );
}
