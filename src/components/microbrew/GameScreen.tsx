'use client';

import { useState, type ComponentProps } from 'react';
import { Button } from '@/components/Button';
import type { BeerColour, Customer, Recipe, ReputationCard } from '@/lib/microbrew/data';
import { getLegalTargets, sameSlot, swapTokens, tokenAt } from '@/lib/microbrew/copper';
import type { CopperSlot, GameState, PlayerIndex } from '@/lib/microbrew/game';
import { cn } from '@/lib/utils';
import { Copper, TokenChip } from './Copper';

// The game screen: an action panel for whatever the game is waiting on (setup
// choices, then Brew), both players' breweries, and the shared table. The
// current player's own Copper is the interactive board. Turns and the other
// actions arrive in WEB-181 onwards; the cards and summaries are still plain
// placeholders.

interface GameScreenProps {
  game: GameState;
  recipeBacks: [BeerColour[], BeerColour[]];
  onReturnRecipe: (recipeId: string) => void;
  onSwapHop: (slot: CopperSlot) => void;
  onBrewSwap: (from: CopperSlot, to: CopperSlot) => void;
  onEndBrew: () => void;
  onNewGame: () => void;
}

type CopperInteraction = Pick<
  ComponentProps<typeof Copper>,
  'onSlotClick' | 'isSlotEnabled' | 'selectedSlot' | 'targetSlots'
>;

const panelClassName = 'rounded-lg border border-gray-300 dark:border-gray-700 p-4 text-left';
const mutedClassName = 'text-sm text-gray-600 dark:text-gray-400';

const BEER_COLOUR_STYLES: Record<BeerColour, string> = {
  light: 'bg-yellow-200 text-yellow-950',
  medium: 'bg-orange-300 text-orange-950',
  dark: 'bg-amber-900 text-amber-50',
};

function BeerColourBadge({ colour }: { colour: BeerColour }) {
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium capitalize', BEER_COLOUR_STYLES[colour])}>
      {colour}
    </span>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { perfect, smooth, rough, muddled } = recipe.payouts;
  return (
    <div className={cn(panelClassName, 'space-y-2')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex gap-1">
          {recipe.malts.map((malt, i) => (
            <TokenChip key={i} token={malt} />
          ))}
        </span>
        <BeerColourBadge colour={recipe.colour} />
      </div>
      <p className="text-sm">
        Perfect{' '}
        <span className={recipe.perfectStruckThrough ? 'line-through' : undefined}>${perfect}</span> · Smooth $
        {smooth} · Rough ${rough} · Muddled ${muddled}
      </p>
      {recipe.flavours.length > 0 && <p className={cn(mutedClassName, 'first-letter:uppercase')}>{recipe.flavours.join(', ')}</p>}
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className={cn(panelClassName, 'space-y-2')}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{customer.name}</span>
        <BeerColourBadge colour={customer.colour} />
      </div>
      <p className="flex items-center gap-2 text-sm">
        <span className="flex gap-1">
          {customer.drink.map((malt, i) => (
            <TokenChip key={i} token={malt} />
          ))}
        </span>
        <span className={mutedClassName}>{customer.country}</span>
      </p>
      {customer.flavourBonus && (
        <p className={cn(mutedClassName, 'first-letter:uppercase')}>
          {customer.flavourBonus.flavour} bonus +${customer.flavourBonus.amount}
        </p>
      )}
    </div>
  );
}

function reputationLabel(card: ReputationCard) {
  return card.type === 'flavour' ? `Flavour: ${card.flavour}` : `Regional: ${card.countries.join(', ')}`;
}

interface PlayerPanelProps {
  game: GameState;
  index: PlayerIndex;
  recipeBacks: BeerColour[];
  /** Makes this player's Copper the interactive board. */
  interaction?: CopperInteraction;
}

function PlayerPanel({ game, index, recipeBacks, interaction }: PlayerPanelProps) {
  const player = game.players[index];
  return (
    <section aria-label={`${player.name}'s brewery`} className={cn(panelClassName, 'space-y-3')}>
      <h3 className="text-lg font-semibold">
        {player.name}
        {game.firstPlayer === index && <span className={cn(mutedClassName, 'ml-2 font-normal')}>(first player)</span>}
      </h3>
      <p className="text-sm">
        Cash ${player.cash} · {player.readyBrewers} ready brewers · {player.reputation.length} secret reputation cards
      </p>
      <div className="flex items-center gap-2 text-sm">
        Recipe backs:
        {recipeBacks.map((colour, i) => (
          <BeerColourBadge key={i} colour={colour} />
        ))}
      </div>
      <div className={cn('py-2 rounded-lg', interaction && 'bg-sky-500/10 ring-2 ring-sky-500/40')}>
        <Copper copper={player.copper} label={`${player.name}'s Copper`} {...interaction} />
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Loyal customer</h4>
        {player.loyalCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </section>
  );
}

function ReturnRecipeStep({ game, onReturnRecipe }: Pick<GameScreenProps, 'game' | 'onReturnRecipe'>) {
  // Hot-seat: the hand stays hidden until the player it belongs to asks to see it.
  const [revealed, setRevealed] = useState(false);
  const player = game.players[game.currentPlayer];
  const opponent = game.players[game.firstPlayer];

  if (!revealed) {
    return (
      <div className="space-y-3">
        <p>
          {player.name} is going second, so they drew an extra recipe. {opponent.name}, look away while {player.name}{' '}
          chooses one to shuffle back into the deck.
        </p>
        <Button variant="primary" onClick={() => setRevealed(true)}>
          Show {player.name}&apos;s hand
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p>{player.name}, choose a recipe to shuffle back into the deck. You&apos;ll keep the other.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {player.recipeHand.map((recipe) => (
          <div key={recipe.id} className="space-y-2">
            <RecipeCard recipe={recipe} />
            <Button variant="secondary" size="sm" onClick={() => onReturnRecipe(recipe.id)}>
              Return this recipe
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BrewStepProps {
  game: GameState;
  picked: CopperSlot | null;
  notice: string | null;
  onCancel: () => void;
  onEndBrew: () => void;
}

function BrewStep({ game, picked, notice, onCancel, onEndBrew }: BrewStepProps) {
  const player = game.players[game.currentPlayer];
  const swaps = game.brew?.swaps ?? 0;
  const instruction = game.brew
    ? `${player.name} is brewing: ${swaps} ${swaps === 1 ? 'swap' : 'swaps'} so far. Keep swapping the same token into a highlighted spot, or end the brew here.`
    : picked
      ? 'Now pick a highlighted neighbour to swap with, or pick a different token.'
      : `${player.name}, Brew: pick a token in your Copper to move. It can keep swapping for as long as it has a legal move.`;

  return (
    <div className="space-y-3">
      <p>{instruction}</p>
      {/* Fixed-height row so the board below doesn't jump as buttons come and go mid-puzzle. */}
      <div className="flex flex-wrap items-center gap-3 min-h-10">
        {game.brew && (
          <Button variant="primary" size="sm" onClick={onEndBrew}>
            End brew
          </Button>
        )}
        {!game.brew && picked && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <p role="status" className="text-sm font-medium">
          {notice}
        </p>
      </div>
      <p className={mutedClassName}>
        Tokens swap along the lines. Light malts rise and dark malts sink: a swap always leaves the lighter malt on
        top. Hops swap with anything.
      </p>
      <p className={mutedClassName}>Other actions and turns arrive in later updates.</p>
    </div>
  );
}

export function GameScreen({
  game,
  recipeBacks,
  onReturnRecipe,
  onSwapHop,
  onBrewSwap,
  onEndBrew,
  onNewGame,
}: GameScreenProps) {
  const { board } = game;
  const player = game.players[game.currentPlayer];

  // Brew: a token picked but not yet swapped is UI-only; once it has swapped,
  // the engine's game.brew says which token is moving.
  const [picked, setPicked] = useState<CopperSlot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const movingSlot = game.brew?.slot ?? picked;
  const targets = movingSlot ? getLegalTargets(player.copper, movingSlot) : [];
  const isTarget = (slot: CopperSlot) => targets.some((t) => sameSlot(t, slot));

  let interaction: CopperInteraction | undefined;
  if (game.phase === 'hopSwap') {
    interaction = {
      onSlotClick: onSwapHop,
      isSlotEnabled: (slot) => {
        const token = tokenAt(player.copper, slot);
        return !!token && token !== 'hops';
      },
    };
  } else if (game.phase === 'playing') {
    interaction = {
      selectedSlot: movingSlot,
      targetSlots: targets,
      // Mid-chain only the moving token's targets are live; otherwise any token
      // with a legal move can be picked (or re-picked).
      isSlotEnabled: (slot) =>
        isTarget(slot) || (!game.brew && getLegalTargets(player.copper, slot).length > 0),
      onSlotClick: (slot) => {
        if (movingSlot && isTarget(slot)) {
          const after = swapTokens(player.copper, movingSlot, slot);
          setNotice(
            getLegalTargets(after, slot).length === 0
              ? "Brew finished: that token can't move any further."
              : null,
          );
          setPicked(null);
          onBrewSwap(movingSlot, slot);
          return;
        }
        setNotice(null);
        setPicked(picked && sameSlot(picked, slot) ? null : slot);
      },
    };
  }

  const handleEndBrew = () => {
    setNotice('Brew finished.');
    onEndBrew();
  };

  const heading =
    game.phase === 'playing' ? `${player.name}'s turn` : 'Setup';

  return (
    <div className="py-8 space-y-8">
      <section aria-labelledby="microbrew-action-heading" className={cn(panelClassName, 'space-y-3')}>
        <h2 id="microbrew-action-heading" className="text-2xl font-bold">
          {heading}
        </h2>
        {game.phase === 'returnRecipe' && <ReturnRecipeStep game={game} onReturnRecipe={onReturnRecipe} />}
        {game.phase === 'hopSwap' && (
          <>
            <p>
              {player.name}, pick a malt in your highlighted Copper to replace with your starting hop. The malt goes
              back in the tin.
            </p>
            <p className={mutedClassName}>Tip: choose one of the 4 malts in the middle.</p>
          </>
        )}
        {game.phase === 'playing' && (
          <BrewStep
            game={game}
            picked={picked}
            notice={notice}
            onCancel={() => setPicked(null)}
            onEndBrew={handleEndBrew}
          />
        )}
        <Button variant="ghost" size="sm" onClick={onNewGame}>
          New game
        </Button>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {([0, 1] as const).map((index) => (
          <PlayerPanel
            key={index}
            game={game}
            index={index}
            recipeBacks={recipeBacks[index]}
            interaction={index === game.currentPlayer ? interaction : undefined}
          />
        ))}
      </div>

      <section aria-label="Shared table" className={cn(panelClassName, 'space-y-4')}>
        <h3 className="text-lg font-semibold">Shared table</h3>
        <p className="text-sm">
          Brewmaster on <span className="capitalize">{board.brewmaster}</span> · Tin: {board.tin.length} tokens ·
          Supply: {board.supply.upgradeTokens} upgrade tokens, {board.supply.spareBrewers[0] + board.supply.spareBrewers[1]}{' '}
          spare brewers
        </p>
        <p className="text-sm">Public reputation: {reputationLabel(board.publicReputation)}</p>
        <div>
          <h4 className="text-sm font-medium mb-2">Thirsty customers</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {board.thirstyCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Revealed recipes</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {board.revealedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
