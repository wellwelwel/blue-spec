#!/usr/bin/env bash
set -euo pipefail

rm -rf lib

esbuild() {
  echo "esbuild $1 \
    --bundle \
    --platform=node \
    --format=esm \
    --target=node22 \
    --tree-shaking=true \
    --minify-syntax \
    --outfile=$2 \
    --banner:js='#!/usr/bin/env node'"
}

commands=()
names=()

commands+=("$(esbuild src/bin/index.ts lib/bin/index.js)")
names+=("bin")

for entry in src/hooks/*.ts; do
  [[ -e "$entry" ]] || continue
  name="$(basename "$entry" .ts)"
  commands+=("$(esbuild "$entry" "lib/hooks/${name}.mjs")")
  names+=("$name")
done

for entry in src/hooks/*/index.ts; do
  [[ -e "$entry" ]] || continue
  name="$(basename "$(dirname "$entry")")"
  commands+=("$(esbuild "$entry" "lib/hooks/${name}.mjs")")
  names+=("$name")
done

names_joined="$(IFS=,; echo "${names[*]}")"

concurrently \
  --names "$names_joined" \
  --kill-others-on-fail \
  "${commands[@]}"

chmod +x lib/bin/index.js

bash scripts/dashboard/build.sh
