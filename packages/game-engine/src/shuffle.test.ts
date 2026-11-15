import { describe, expect, it } from 'vitest';
import { createDeck } from './deck.js';
import { shuffle } from './shuffle.js';

describe('shuffle', () => {
  it('produces the same order for the same seed', () => {
    const deck = createDeck();
    const a = shuffle(deck, 42);
    const b = shuffle(deck, 42);
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
    expect(a.seed).toBe(b.seed);
  });

  it('produces a different order for a different seed', () => {
    const deck = createDeck();
    const a = shuffle(deck, 1);
    const b = shuffle(deck, 2);
    expect(a.cards.map((c) => c.id)).not.toEqual(b.cards.map((c) => c.id));
  });

  it('does not mutate the input array', () => {
    const deck = createDeck();
    const before = deck.map((c) => c.id);
    shuffle(deck, 7);
    expect(deck.map((c) => c.id)).toEqual(before);
  });

  it('keeps all cards', () => {
    const { cards } = shuffle(createDeck(), 3);
    expect(cards).toHaveLength(108);
    expect(new Set(cards.map((c) => c.id)).size).toBe(108);
  });
});
