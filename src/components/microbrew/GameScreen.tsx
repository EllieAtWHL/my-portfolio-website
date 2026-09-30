'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import type { BeerColour, Customer, Recipe, ReputationCard } from '@/lib/microbrew/data';
import type { CopperSlot, GameState, PlayerIndex } from '@/lib/microbrew/game';
import { cn } from '@/lib/utils';
import { Copper, TokenChip } from './Copper';

// Placeholder UI for the setup choices (WEB-179): returning a recipe and the
// two hop swaps, plus a plain summary of what's been dealt. Later stories
// replace the pieces with the real board.

interface SetupScreenProps {
  game: GameState;
  recipeBacks: [BeerColour[], BeerColour[]];
  onReturnRecipe: (recipeId: string) => void;
  onSwapHop: (slot: CopperSlot) => void;
  onNewGame: () => void;
}

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

function PlayerPanel({ game, index, recipeBacks }: { game: GameState; index: PlayerIndex; recipeBacks: BeerColour[] }) {
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
      <div className="flex justify-center">
        <Copper copper={player.copper} label={`${player.name}'s Copper`} />
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

function ReturnRecipeStep({ game, onReturnRecipe }: Pick<SetupScreenProps, 'game' | 'onReturnRecipe'>) {
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

function HopSwapStep({ game, onSwapHop }: Pick<SetupScreenProps, 'game' | 'onSwapHop'>) {
  const player = game.players[game.currentPlayer];
  return (
    <div className="space-y-3">
      <p>
        {player.name}, pick a malt in your Copper to replace with your starting hop. The malt goes back in the tin.
      </p>
      <p className={mutedClassName}>Tip: choose one of the 4 malts in the middle.</p>
      <div className="flex justify-center">
        <Copper copper={player.copper} onSelectSlot={onSwapHop} label={`${player.name}'s Copper`} />
      </div>
    </div>
  );
}

export function SetupScreen({ game, recipeBacks, onReturnRecipe, onSwapHop, onNewGame }: SetupScreenProps) {
  const { board } = game;
  return (
    <div className="py-8 space-y-8">
      <section aria-labelledby="microbrew-setup-heading" className={cn(panelClassName, 'space-y-3')}>
        <h2 id="microbrew-setup-heading" className="text-2xl font-bold">
          {game.phase === 'playing' ? 'Setup complete' : 'Setup'}
        </h2>
        {game.phase === 'returnRecipe' && <ReturnRecipeStep game={game} onReturnRecipe={onReturnRecipe} />}
        {game.phase === 'hopSwap' && <HopSwapStep game={game} onSwapHop={onSwapHop} />}
        {game.phase === 'playing' && (
          <>
            <p>{game.players[game.firstPlayer].name} goes first.</p>
            <p className={mutedClassName}>Turns aren&apos;t playable yet; they arrive in a later update.</p>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onNewGame}>
          New game
        </Button>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <PlayerPanel game={game} index={0} recipeBacks={recipeBacks[0]} />
        <PlayerPanel game={game} index={1} recipeBacks={recipeBacks[1]} />
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
