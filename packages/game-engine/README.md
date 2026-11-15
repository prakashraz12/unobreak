# @repo/game-engine

A deterministic, dependency-free UNO game engine. The same package runs in the
Next.js web app (local "vs computer" games via `bot.ts`) and in the NestJS
backend (authoritative multiplayer). All state is plain serializable JSON, so
games can be persisted, sent over the wire, or replayed.

## Usage

```ts
import {
  createGame,
  applyAction,
  chooseBotAction,
  getPlayerView,
} from '@repo/game-engine';

let state = createGame({ playerIds: ['alice', 'bot'], seed: 42 });
const result = applyAction(state, chooseBotAction(state, 'alice'));
if (result.ok) state = result.state;

const view = getPlayerView(state, 'alice'); // safe to send to alice's client
```

`applyAction` never mutates its input; it returns `{ ok, state, events }`.
`validateAction` returns a human-readable error or `null`. Randomness is driven
by a seeded PRNG whose state lives in `state.seed` — same seed, same game.

## Not supported

These are intentionally left to callers:

- **Jump-in / interrupting out of turn** — only the current player may act.
- **Turn timers and total game time** — `rules.turnTimeLimit` and
  `rules.totalGameTime` are declared but not enforced; callers enforce them,
  e.g. by applying a `draw`/`pass` action on timeout.
- **Scoring / multi-round matches** — a game ends when a player empties their
  hand; tracking points across rounds is the caller's job.
