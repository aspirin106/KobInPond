#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dist="$root/dist"
rm -rf "$dist"
mkdir -p "$dist/client/images/generated" "$dist/server" "$dist/.openai"
cp "$root/index.html" "$root/style.css" "$root/game.js" "$root/rules.js" "$root/textures.js" \
  "$root/sw.js" "$root/manifest.json" "$dist/client/"
cp "$root"/images/*.png "$dist/client/images/"
cp "$root"/images/*.webp "$dist/client/images/"
cp "$root"/images/generated/*.webp "$dist/client/images/generated/"
cp "$root/worker/index.js" "$dist/server/index.js"
cp "$root/rules.js" "$root/leaderboard-api.js" "$dist/server/"
cp "$root/.openai/hosting.json" "$dist/.openai/hosting.json"
