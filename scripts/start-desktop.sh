#!/bin/bash
# ==============================================================================
# Agent Griffty — Desktop App Runner with Clean Lifecycle
# ==============================================================================
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# Free up ports 8787 and 5173 if previously in use
lsof -ti:8787,5173 | xargs kill -9 2>/dev/null || true

# Trap exit to kill background jobs cleanly
cleanup() {
  echo ""
  echo "Closing Griffty Desktop and shutting down background servers..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "🚀 Starting Agent Griffty local servers..."
GRIFFTY_STATE_DIR=.griffty npm run dev --workspace=@griffty/server &
npm run dev --workspace=@griffty/dashboard &

echo "⏳ Waiting for local dashboard to be ready..."
sleep 3

echo "🖥️  Launching native Electron desktop window..."
node node_modules/electron/cli.js apps/electron/dist/main.js
