import { describe, expect, it } from 'vitest';
import { createDeck } from './deck.js';
import type { Color } from './types.js';

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];

describe('createDeck', () => {
  it('builds 108 cards with unique ids', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(108);
    expect(new Set(deck.map((c) => c.id)).size).toBe(108);
  });

  it('has correct counts per color and value', () => {
    const deck = createDeck();
    for (const color of COLORS) {
      const colored = deck.filter((c) => c.color === color);
      expect(colored).toHaveLength(25);
      expect(colored.filter((c) => c.value === '0')).toHaveLength(1);
      for (const v of [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'skip',
        'reverse',
        'draw2',
      ]) {
        expect(colored.filter((c) => c.value === v)).toHaveLength(2);
      }
    }
    expect(deck.filter((c) => c.value === 'wild')).toHaveLength(4);
    expect(deck.filter((c) => c.value === 'wild4')).toHaveLength(4);
    for (const wild of deck.filter(
      (c) => c.value === 'wild' || c.value === 'wild4',
    )) {
      expect(wild.color).toBeNull();
    }
  });
});
