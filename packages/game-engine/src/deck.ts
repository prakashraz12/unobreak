import type { Card, Color, CardValue } from './types.js';

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS: CardValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS: CardValue[] = ['skip', 'reverse', 'draw2'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    deck.push({ id: `${color}-0-0`, color, value: '0' });
    for (const value of [...NUMBERS, ...ACTIONS]) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({ id: `${color}-${value}-${copy}`, color, value });
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `wild-${i}`, color: null, value: 'wild' });
    deck.push({ id: `wild4-${i}`, color: null, value: 'wild4' });
  }
  return deck;
}
