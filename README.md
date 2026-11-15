# UNO — Monorepo

An online UNO game built as a [Turborepo](https://turborepo.dev) monorepo. Play solo against bots, 1v1 duels, 2v2 teams, or private rooms with friends — with real-time multiplayer over WebSockets.

## What's inside?

### Apps

- `apps/web` — the game client, a [Next.js](https://nextjs.org/) app (port `3000`). Contains the menu, lobby, matchmaking, and the game table UI.
- `apps/backend` — the game server, a [NestJS](https://nestjs.com/) app. Handles auth, matches, friends/invites, and real-time game sessions.

### Packages

- `@repo/game-engine` — the shared UNO rules engine (cards, turns, penalties, win conditions) used by both client and server.
- `@repo/socket` — typed socket provider/hooks shared across apps.
- `@repo/ui` — shared React components (buttons, etc.).
- `@repo/eslint-config` — shared ESLint configuration.
- `@repo/typescript-config` — shared `tsconfig.json`s used throughout the monorepo.

Everything is written in [TypeScript](https://www.typescriptlang.org/).

## Getting started

Requires Node.js `>=24` and `pnpm` (see `packageManager` in `package.json`).

```sh
pnpm install
```

### Develop

Run all apps:

```sh
pnpm dev
```

Run a single app:

```sh
pnpm dev --filter=web
pnpm dev --filter=backend
```

### Build

```sh
pnpm build
```

Or a single package:

```sh
pnpm build --filter=web
```

### Lint, format, typecheck

```sh
pnpm lint
pnpm format        # write
pnpm format:check  # check only
pnpm check-types
```

## Useful links

- [Turborepo tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration options](https://turborepo.dev/docs/reference/configuration)

## License

[MIT](./LICENSE)
