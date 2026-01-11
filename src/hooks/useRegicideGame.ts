'use client';

import { useState, useCallback, useEffect } from 'react';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  power: number;
}

interface GameData {
  isPlaying: boolean;
  currentRoyal: Card | null;
  playerHand: Card[];
  royalDeck: Card[];
  tavernDeck: Card[];
  discardPile: Card[];
  playerPower: number;
  royalPower: number;
  health: number;
  currentTurn: number;
  gameOver: boolean;
  victory: boolean;
}

interface GameStats {
  gamesStarted: number;
  gamesWon: number;
  gamesLost: number;
  lastPlayed: string;
  totalPlayTime: number;
}

// Helper functions to create cards
const createCard = (suit: Card['suit'], rank: string, power: number): Card => ({
  suit,
  rank,
  power
});

const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  
  // Add numbered cards (2-10)
  for (const suit of suits) {
    for (let i = 2; i <= 10; i++) {
      deck.push(createCard(suit, i.toString(), i));
    }
  }
  
  // Add face cards
  for (const suit of suits) {
    deck.push(createCard(suit, 'J', 11));
    deck.push(createCard(suit, 'Q', 12));
    deck.push(createCard(suit, 'K', 13));
  }
  
  // Add Aces
  for (const suit of suits) {
    deck.push(createCard(suit, 'A', 1));
  }
  
  return deck;
};

const createRoyalDeck = (): Card[] => {
  return [
    createCard('hearts', 'J', 11),
    createCard('diamonds', 'J', 11),
    createCard('clubs', 'J', 11),
    createCard('spades', 'J', 11),
    createCard('hearts', 'Q', 12),
    createCard('diamonds', 'Q', 12),
    createCard('clubs', 'Q', 12),
    createCard('spades', 'Q', 12),
    createCard('hearts', 'K', 13),
    createCard('diamonds', 'K', 13),
    createCard('clubs', 'K', 13),
    createCard('spades', 'K', 13)
  ];
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function useRegicideGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData>({
    isPlaying: false,
    currentRoyal: null,
    playerHand: [],
    royalDeck: [],
    tavernDeck: [],
    discardPile: [],
    playerPower: 0,
    royalPower: 0,
    health: 20,
    currentTurn: 0,
    gameOver: false,
    victory: false
  });

  const initializeGame = useCallback(() => {
    setIsLoading(true);
    
    // Initialize game immediately
    setGameData({
      isPlaying: false,
      currentRoyal: null,
      playerHand: [],
      royalDeck: [],
      tavernDeck: [],
      discardPile: [],
      playerPower: 0,
      royalPower: 0,
      health: 20,
      currentTurn: 0,
      gameOver: false,
      victory: false
    });
    setIsLoading(false);
  }, []);

  const playCard = useCallback((cardIndex: number) => {
    setGameData(prev => {
      if (!prev.isPlaying || prev.gameOver || cardIndex >= prev.playerHand.length) {
        return prev;
      }

      const card = prev.playerHand[cardIndex];
      const newHand = prev.playerHand.filter((_, i) => i !== cardIndex);
      const newDiscardPile = [...prev.discardPile, card];
      
      // Calculate damage (simplified Regicide rules)
      const damage = Math.max(0, card.power - prev.currentRoyal!.power);
      const newHealth = prev.health - Math.max(1, prev.currentRoyal!.power - card.power);
      
      // Check if royal is defeated
      if (damage >= prev.currentRoyal!.power) {
        // Royal defeated, draw next royal or win game
        const nextRoyal = prev.royalDeck.pop();
        if (!nextRoyal) {
          // All royals defeated - victory!
          return {
            ...prev,
            playerHand: newHand,
            discardPile: newDiscardPile,
            gameOver: true,
            victory: true
          };
        }
        
        // Continue with next royal
        return {
          ...prev,
          currentRoyal: nextRoyal,
          playerHand: newHand,
          discardPile: newDiscardPile,
          royalPower: nextRoyal.power,
          playerPower: newHand.reduce((sum, c) => sum + c.power, 0)
        };
      }
      
      // Check if player is defeated
      if (newHealth <= 0) {
        return {
          ...prev,
          playerHand: newHand,
          discardPile: newDiscardPile,
          health: 0,
          gameOver: true,
          victory: false
        };
      }
      
      // Continue game
      return {
        ...prev,
        playerHand: newHand,
        discardPile: newDiscardPile,
        health: newHealth,
        playerPower: newHand.reduce((sum, c) => sum + c.power, 0)
      };
    });
  }, []);

  const drawCard = useCallback(() => {
    setGameData(prev => {
      if (!prev.isPlaying || prev.gameOver || prev.tavernDeck.length === 0) {
        return prev;
      }

      const newCard = prev.tavernDeck.pop()!;
      const newHand = [...prev.playerHand, newCard];
      
      return {
        ...prev,
        playerHand: newHand,
        tavernDeck: prev.tavernDeck,
        playerPower: newHand.reduce((sum, card) => sum + card.power, 0)
      };
    });
  }, []);

  const startGame = useCallback(() => {
    // Create and shuffle decks
    const shuffledRoyalDeck = shuffleDeck(createRoyalDeck());
    const shuffledTavernDeck = shuffleDeck(createDeck());
    
    // Draw initial player hand (5 cards)
    const playerHand = shuffledTavernDeck.splice(0, 5);
    
    // Draw first royal
    const firstRoyal = shuffledRoyalDeck.pop()!;
    
    // Initialize game state
    setGameData({
      isPlaying: true,
      currentRoyal: firstRoyal,
      playerHand: playerHand,
      royalDeck: shuffledRoyalDeck,
      tavernDeck: shuffledTavernDeck,
      discardPile: [],
      playerPower: playerHand.reduce((sum, card) => sum + card.power, 0),
      royalPower: firstRoyal.power,
      health: 20,
      currentTurn: 1,
      gameOver: false,
      victory: false
    });
  }, []);

  const endTurn = useCallback(() => {
    // Game logic for ending turn
    console.log('Ending turn...');
  }, []);

  const undoAction = useCallback(() => {
    // Game logic for undoing action
    console.log('Undoing action...');
  }, []);

  const loadStats = useCallback((): GameStats => {
    if (typeof window === 'undefined') {
      return {
        gamesStarted: 0,
        gamesWon: 0,
        gamesLost: 0,
        lastPlayed: 'Never',
        totalPlayTime: 0
      };
    }

    const savedStats = localStorage.getItem('regicide-stats');
    if (savedStats) {
      return JSON.parse(savedStats);
    }

    return {
      gamesStarted: 0,
      gamesWon: 0,
      gamesLost: 0,
      lastPlayed: 'Never',
      totalPlayTime: 0
    };
  }, []);

  const saveStats = useCallback((stats: GameStats) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('regicide-stats', JSON.stringify(stats));
    }
  }, []);

  const winGame = useCallback(() => {
    const stats = loadStats();
    stats.gamesWon += 1;
    saveStats(stats);
    
    setGameData(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const loseGame = useCallback(() => {
    const stats = loadStats();
    stats.gamesLost += 1;
    saveStats(stats);
    
    setGameData(prev => ({ ...prev, isPlaying: false }));
  }, []);

  return {
    isLoading,
    gameData,
    initializeGame,
    startGame,
    endTurn,
    undoAction,
    playCard,
    drawCard,
    winGame,
    loseGame,
    loadStats,
    saveStats
  };
}
