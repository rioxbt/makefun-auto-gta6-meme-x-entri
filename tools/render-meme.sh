#!/usr/bin/env bash
# Render tools/meme.html to meme.png with the headless browser, at exactly 1080x1080.
# Deterministic: the page uses no webfonts, no randomness and no network, so the same HTML always renders the same
# bytes. Run from the repository root.
set -euo pipefail

cd "$(dirname "$0")/.."

CHROME="${CHROME:-$HOME/.hermes/tools/chromium-1208/chrome-linux64/chrome}"
[ -x "$CHROME" ] || { echo "no chromium at $CHROME (set CHROME=)" >&2; exit 1; }

SCRATCH=".tmp/render"
rm -rf "$SCRATCH"
mkdir -p "$SCRATCH"

"$CHROME" \
  --headless=new \
  --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 \
  --user-data-dir="$PWD/$SCRATCH/profile" \
  --window-size=1080,1080 \
  --screenshot="$PWD/meme.png" \
  "file://$PWD/tools/meme.html" 2>/dev/null

[ -s meme.png ] || { echo "chromium wrote no meme.png" >&2; exit 1; }
echo "wrote meme.png ($(stat -c%s meme.png) bytes)"
