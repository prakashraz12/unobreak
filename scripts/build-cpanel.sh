#!/usr/bin/env bash
# Builds upload-ready cPanel packages into deploy/.
#
#   deploy/backend/  -> Node.js app: startup file loader.cjs
#   deploy/web/      -> Node.js app: startup file apps/web/server.js
#
# Set NEXT_PUBLIC_API_BASE_URL in apps/web/.env to the production API URL
# before running — it is inlined into the frontend bundle at build time.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf deploy
mkdir -p deploy

pnpm run build --filter @repo/game-engine --filter backend --filter web

pnpm --filter backend deploy --prod --legacy deploy/backend
cp -R apps/backend/dist deploy/backend/dist

mkdir -p deploy/web
cp -R apps/web/.next/standalone/. deploy/web/
cp -R apps/web/.next/static deploy/web/apps/web/.next/static
cp -R apps/web/public deploy/web/apps/web/public

echo
echo "Done. Upload the contents of:"
echo "  deploy/backend/  (startup file: loader.cjs)"
echo "  deploy/web/      (startup file: apps/web/server.js)"
