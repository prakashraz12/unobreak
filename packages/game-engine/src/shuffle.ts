import { nextRandom } from './random.js';
import type { Card } from './types.js';

export function shuffle(
  cards: Card[],
  seed: number,
): { cards: Card[]; seed: number } {
  const result = [...cards];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    const { value, seed: nextSeed } = nextRandom(currentSeed);
    currentSeed = nextSeed;
    const j = Math.floor(value * (i + 1));
    const a = result[i]!;
    result[i] = result[j]!;
    result[j] = a;
  }
  return { cards: result, seed: currentSeed };
}
