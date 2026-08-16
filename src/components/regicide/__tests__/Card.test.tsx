import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

// Guards the traditional pip layout against accidental regressions - pip count,
// position, size and corner placement have all been fine-tuned by eye, and none
// of that is obvious from reading the component alone.
const PIP_COUNTS: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
};

function getPipCells(card: HTMLElement) {
  return Array.from(card.querySelectorAll(':scope > .grid > span')) as HTMLElement[];
}

describe('Regicide Card - pip layout', () => {
  it.each(Object.entries(PIP_COUNTS))('renders exactly %s pip(s) for rank %s', (rank, count) => {
    render(<Card suit="hearts" rank={rank} />);
    const card = screen.getByRole('img', { name: `${rank} of Hearts` });
    expect(getPipCells(card)).toHaveLength(count);
  });

  it('positions the 5 pips at the four corners plus dead centre', () => {
    render(<Card suit="clubs" rank="5" />);
    const card = screen.getByRole('img', { name: '5 of Clubs' });
    const positions = getPipCells(card).map((cell) => ({
      row: cell.style.gridRowStart,
      col: cell.style.gridColumnStart,
    }));

    expect(positions).toEqual(
      expect.arrayContaining([
        { row: '1', col: '1' },
        { row: '1', col: '3' },
        { row: '4', col: '2' },
        { row: '7', col: '1' },
        { row: '7', col: '3' },
      ])
    );
  });

  it('positions the 10 pips using two side columns plus two centre pips', () => {
    render(<Card suit="diamonds" rank="10" />);
    const card = screen.getByRole('img', { name: '10 of Diamonds' });
    const positions = getPipCells(card).map((cell) => ({
      row: cell.style.gridRowStart,
      col: cell.style.gridColumnStart,
    }));

    expect(positions).toEqual(
      expect.arrayContaining([
        { row: '1', col: '1' }, { row: '1', col: '3' },
        { row: '2', col: '2' },
        { row: '3', col: '1' }, { row: '3', col: '3' },
        { row: '5', col: '1' }, { row: '5', col: '3' },
        { row: '6', col: '2' },
        { row: '7', col: '1' }, { row: '7', col: '3' },
      ])
    );
  });

  it('rotates only the bottom-half pips 180 degrees', () => {
    render(<Card suit="spades" rank="4" />);
    const card = screen.getByRole('img', { name: '4 of Spades' });
    const cells = getPipCells(card);
    const rotated = cells.filter((cell) => cell.style.transform === 'rotate(180deg)');
    const unrotated = cells.filter((cell) => !cell.style.transform);

    expect(rotated).toHaveLength(2);
    expect(unrotated).toHaveLength(2);
  });

  it('sizes each pip icon at the current agreed dimensions (24px / w-6 h-6)', () => {
    render(<Card suit="hearts" rank="8" />);
    const card = screen.getByRole('img', { name: '8 of Hearts' });
    for (const cell of getPipCells(card)) {
      const icon = cell.querySelector('div');
      expect(icon).toHaveClass('w-6', 'h-6');
    }
  });

  it('uses the original site\'s suit artwork as the pip icon', () => {
    render(<Card suit="diamonds" rank="3" />);
    const card = screen.getByRole('img', { name: '3 of Diamonds' });
    const icon = card.querySelector(':scope > .grid > span > div');
    expect(icon).toHaveStyle({ backgroundImage: 'url(/regicide/diamond.svg)' });
  });
});

describe('Regicide Card - face cards', () => {
  it('renders a single large suit icon for Ace, not a pip grid', () => {
    render(<Card suit="spades" rank="A" />);
    const card = screen.getByRole('img', { name: 'Ace of Spades' });
    expect(card.querySelector(':scope > .grid')).not.toBeInTheDocument();
    expect(card.querySelector(':scope > .w-14.h-14')).toBeInTheDocument();
  });

  it.each([
    ['J', 'Jack', 'jack'],
    ['Q', 'Queen', 'queen'],
    ['K', 'King', 'king'],
  ])('renders the dedicated %s face artwork, not a pip grid', (rank, name, file) => {
    render(<Card suit="clubs" rank={rank} />);
    const card = screen.getByRole('img', { name: `${name} of Clubs` });
    expect(card.querySelector(':scope > .grid')).not.toBeInTheDocument();
    const faceIcon = card.querySelector(':scope > .w-16.h-16') as HTMLElement | null;
    expect(faceIcon).toHaveStyle({ backgroundImage: `url(/regicide/${file}-black.svg)` });
  });

  it.each([
    ['hearts', 'red'],
    ['diamonds', 'red'],
    ['spades', 'black'],
    ['clubs', 'black'],
  ])('uses the %s-suit face artwork variant (%s) for royals', (suit, color) => {
    render(<Card suit={suit as 'hearts' | 'diamonds' | 'spades' | 'clubs'} rank="Q" />);
    const suitLabel = suit.charAt(0).toUpperCase() + suit.slice(1);
    const card = screen.getByRole('img', { name: `Queen of ${suitLabel}` });
    const faceIcon = card.querySelector(':scope > .w-16.h-16');
    expect(faceIcon).toHaveStyle({ backgroundImage: `url(/regicide/queen-${color}.svg)` });
  });
});

describe('Regicide Card - corner rank markers', () => {
  it('pins the rank + suit markers to the top-left and bottom-right corners', () => {
    render(<Card suit="diamonds" rank="9" />);
    const card = screen.getByRole('img', { name: '9 of Diamonds' });
    expect(card.querySelector('.top-0\\.5.left-0\\.5')).toBeInTheDocument();
    expect(card.querySelector('.bottom-0\\.5.right-0\\.5.rotate-180')).toBeInTheDocument();
  });
});

describe('Regicide Card - royal combat value badge', () => {
  it('shows the badge for a royal only when showValue is true', () => {
    const { rerender } = render(<Card suit="hearts" rank="K" />);
    expect(screen.queryByText('20')).not.toBeInTheDocument();

    rerender(<Card suit="hearts" rank="K" showValue />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it.each([
    ['J', '10'],
    ['Q', '15'],
    ['K', '20'],
  ])('shows %s\'s combat value as %s', (rank, value) => {
    render(<Card suit="hearts" rank={rank} showValue />);
    expect(screen.getByText(value)).toBeInTheDocument();
  });

  it('never shows a combat value badge for numbered or ace cards, even with showValue', () => {
    render(<Card suit="hearts" rank="7" showValue />);
    const card = screen.getByRole('img', { name: '7 of Hearts' });
    expect(card.querySelector('.bg-gray-100.rounded-full')).not.toBeInTheDocument();
  });
});
