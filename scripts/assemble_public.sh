#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Assemble the static publish directory for Netlify.
#
# The single-file frontend `Commerce App.dc.html` references ./Assets, ./src and
# ./_ds by relative path, so those directories must sit next to it at the site
# root. We serve the app itself as index.html so it loads at `/` with no redirect
# hop, while keeping the original filename too in case anything links to it.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="public"
rm -rf "$OUT"
mkdir -p "$OUT"

cp "Commerce App.dc.html" "$OUT/index.html"
cp "Commerce App.dc.html" "$OUT/Commerce App.dc.html"

for dir in Assets src _ds; do
  if [ -d "$dir" ]; then
    cp -r "$dir" "$OUT/$dir"
  fi
done

echo "Assembled $OUT/ ($(du -sh "$OUT" | cut -f1))"
