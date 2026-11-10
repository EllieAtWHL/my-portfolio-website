'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  HAND_LIMIT,
  ROYAL_STATS,
  SET_LIMITS,
  SUIT_POWER_LABEL,
  TOTAL_JESTERS,
  victoryMedal,
  type Suit,
} from '@/hooks/useRegicideGame';
import { SUIT_ICON_SRC } from './Card';
import { MEDAL_LABEL, MedalIcon } from './Medal';

export const OFFICIAL_RULES_URL =
  'https://www.regicidegame.com/site_files/33132/upload_files/RegicideRulesA4.pdf';

interface RulesModalProps {
  onClose: () => void;
}

const ROYAL_NAME: Record<keyof typeof ROYAL_STATS, string> = { J: 'Jack', Q: 'Queen', K: 'King' };

// Hearts listed before Diamonds deliberately: when both trigger on one
// attack, healing resolves before drawing.
const SUIT_ORDER: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

const SUIT_POWER_DETAIL: Record<Suit, string> = {
  hearts:
    'Shuffle the discard pile and move that many cards to the bottom of the tavern deck, ready to draw again later.',
  diamonds: `Draw that many cards from the tavern deck, never going over your ${HAND_LIMIT}-card hand limit.`,
  clubs: 'Your attack deals double damage.',
  spades:
    "Lower the royal's attack by that much for the rest of the fight. Spades played against the same royal add up.",
};

// The cards' own suit artwork, used as a mask over currentColor rather than
// as an <img>: the SVGs have hard-coded red/black fills, and black would
// vanish against the dark-mode modal background. Unicode suit characters
// aren't used because some platforms render the red ones as colour emoji.
function SuitIcon({ suit }: { suit: Suit }) {
  const red = suit === 'hearts' || suit === 'diamonds';
  const mask = `url(${SUIT_ICON_SRC[suit]}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-5 h-5 mt-0.5 flex-shrink-0 bg-current ${
        red ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-dark-text'
      }`}
      style={{ mask, WebkitMask: mask }}
    />
  );
}

function RulesSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group border-t border-gray-200 dark:border-dark-accent/20 first:border-t-0">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none py-3 font-semibold text-lg [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
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
      {/* Same colour tokens as the shared .modal-content p rule, so lists and
          tables read the same as the paragraphs around them */}
      <div className="pb-4 space-y-3 text-[var(--brand-primary-darkest)] dark:text-[var(--dark-text)]">{children}</div>
    </details>
  );
}

// The solo rules of Regicide, summarised in our own words (WEB-78) rather
// than hosting the publisher's rulebook PDF - see reference/regicide/README.md.
// Every number shown comes from the engine's own constants, so this can't
// drift from how the game actually plays.
export function RulesModal({ onClose }: RulesModalProps) {
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const combos = Object.entries(SET_LIMITS).map(([rank, limit]) => ({ rank, limit: limit as number }));
  const medalRows = Array.from({ length: TOTAL_JESTERS + 1 }, (_, jestersUsed) => ({
    jestersUsed,
    medal: victoryMedal(TOTAL_JESTERS - jestersUsed),
  }));

  const modalContent = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-outside-to-close backdrop; Escape (handled by useFocusTrap on the dialog below) is the keyboard equivalent, not a key event on this div
    <div className="modal-overlay" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- only stops the backdrop's close click from bubbling, not a real interactive handler */}
      <div
        ref={containerRef}
        className="modal-content w-full max-w-2xl text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 id={titleId} className="!mt-0 !mb-0 text-2xl font-bold">
            How to play
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="p-2 -mt-1 bg-gray-100 dark:bg-dark-bg-2 text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg-1 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm !mb-2">
          The solo rules, in short. Tap a section to expand it.
        </p>

        <RulesSection title="Aim of the game" defaultOpen>
          <p>
            Defeat all 12 royals - four Jacks, then four Queens, then four Kings - using the numbered cards
            in your hand. Each royal you don&apos;t defeat in one go hits back, and you pay for that damage by
            discarding cards. Run out, and the royals win.
          </p>
        </RulesSection>

        <RulesSection title="Setup">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Castle deck:</strong> the royals, shuffled within each rank, with the Jacks on top and the
              Kings at the bottom. The top royal is the one you&apos;re fighting.
            </li>
            <li>
              <strong>Tavern deck:</strong> the Aces and 2 to 10 of every suit, shuffled. This is where your
              cards come from.
            </li>
            <li>
              You start with a hand of {HAND_LIMIT} cards and {TOTAL_JESTERS} Jesters set to one side.
            </li>
          </ul>
        </RulesSection>

        <RulesSection title="Your turn">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Play:</strong> choose a card (or a combo) from your hand and attack. Its total value is
              your <em>attack value</em>.
            </li>
            <li>
              <strong>Suit power:</strong> each suit you played triggers its power, using the attack value.
            </li>
            <li>
              <strong>Damage:</strong> the royal takes damage equal to the attack value (doubled by Clubs).
              If its total damage taken reaches its health, it&apos;s defeated and the next royal steps up.
            </li>
            <li>
              <strong>Defend:</strong> if it survives, it hits back. Discard cards worth at least its attack
              to survive.
            </li>
          </ol>
          <p className="text-sm">
            Here, click cards in your hand to choose them, then press Attack. When defending, click cards to
            discard them. Undo takes back your last move.
          </p>
        </RulesSection>

        <RulesSection title="Suit powers">
          <ul className="space-y-2">
            {SUIT_ORDER.map((suit) => (
              <li key={suit} className="flex gap-3">
                <SuitIcon suit={suit} />
                <span>
                  <strong>{SUIT_POWER_LABEL[suit]}.</strong> {SUIT_POWER_DETAIL[suit]}
                </span>
              </li>
            ))}
          </ul>
          <p>
            <strong>Immunity:</strong> a royal ignores the power of cards in its own suit - a Diamond played
            against the Jack of Diamonds draws nothing - but those cards still deal their full damage.
          </p>
          <p className="text-sm">If Hearts and Diamonds trigger together, Hearts heals first, then Diamonds draws.</p>
        </RulesSection>

        <RulesSection title="Combos and Aces">
          <p>Instead of a single card, you can play several cards of the same number, as long as they total 10 or less:</p>
          <ul className="list-disc pl-5 space-y-1">
            {combos.map(({ rank, limit }) => (
              <li key={rank}>
                Up to {limit} × {rank}s (total {limit * Number(rank)})
              </li>
            ))}
          </ul>
          <p>
            <strong>Aces</strong> (Animal Companions) are worth 1. An Ace can be paired with any one other card -
            even another Ace - and both cards&apos; suit powers trigger using the combined value. For example, the
            Ace of Clubs with the 8 of Diamonds is worth 9: you draw 9 cards and deal 18 damage. Aces can&apos;t
            join a same-number combo.
          </p>
          <p className="text-sm">Every suit in a combo triggers its power once, at the combo&apos;s total value.</p>
        </RulesSection>

        <RulesSection title="The royals">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-accent/20">
                <th scope="col" className="py-1 font-semibold">Royal</th>
                <th scope="col" className="py-1 font-semibold">Attack</th>
                <th scope="col" className="py-1 font-semibold">Health</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ROYAL_STATS) as (keyof typeof ROYAL_STATS)[]).map((rank) => (
                <tr key={rank}>
                  <td className="py-1">{ROYAL_NAME[rank]}</td>
                  <td className="py-1">{ROYAL_STATS[rank].attack}</td>
                  <td className="py-1">{ROYAL_STATS[rank].health}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <strong>Exact kill:</strong> defeat a royal with damage exactly equal to its remaining health and
            it goes on top of the tavern deck, so you&apos;ll draw it next. Otherwise it&apos;s
            discarded, along with every card played against it.
          </p>
          <p>
            A royal in your hand is worth its attack value (Jack {ROYAL_STATS.J.attack}, Queen{' '}
            {ROYAL_STATS.Q.attack}, King {ROYAL_STATS.K.attack}), both when attacking and when discarding to
            defend.
          </p>
        </RulesSection>

        <RulesSection title="Defending">
          <p>
            When a royal survives your attack, it hits back for its attack value, minus any Spades played
            against it. Discard cards from your hand worth at least that much. Aces count as 1. If what&apos;s
            left in your hand can&apos;t cover the damage, you lose.
          </p>
        </RulesSection>

        <RulesSection title="Jesters">
          <p>
            You have {TOTAL_JESTERS} Jesters. Use one to discard your whole hand and draw a fresh hand of{' '}
            {HAND_LIMIT}. You can only use a Jester:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>at the start of your turn, before choosing a card, or</li>
            <li>when a royal hits back, before you start discarding.</li>
          </ul>
          <p>
            If a royal hits back for more than your whole hand is worth, use a Jester before discarding - once
            you start discarding, it&apos;s too late.
          </p>
          <p className="text-sm">
            A Jester doesn&apos;t cancel a royal&apos;s immunity in solo play, and it doesn&apos;t reduce the damage
            you owe.
          </p>
        </RulesSection>

        <RulesSection title="Winning and losing">
          <p>
            You win by defeating the last King. You lose if your hand can&apos;t cover a royal&apos;s attack, or if you
            run out of cards and Jesters. Your win earns a medal depending on how many Jesters you used:
          </p>
          <ul className="space-y-1">
            {medalRows.map(({ jestersUsed, medal }) => (
              <li key={jestersUsed} className="flex items-center gap-2">
                <MedalIcon medal={medal} className="w-5 h-5" />
                <span>
                  <strong>{MEDAL_LABEL[medal]}</strong> - {jestersUsed === 0 ? 'no' : jestersUsed}{' '}
                  {jestersUsed === 1 ? 'Jester' : 'Jesters'} used
                </span>
              </li>
            ))}
          </ul>
        </RulesSection>

        <RulesSection title="About these rules">
          <p>
            This is a short guide to solo Regicide, written for this site. Multiplayer rules, such as yielding and
            taking turns, aren&apos;t included because this version is solo only.
          </p>
          <p>
            For the full official rules, see the{' '}
            <a
              href={OFFICIAL_RULES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 dark:text-green-400 underline"
            >
              Regicide rulebook (PDF, opens in a new tab)
            </a>{' '}
            by Badgers From Mars.
          </p>
        </RulesSection>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
