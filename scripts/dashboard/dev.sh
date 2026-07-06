#!/usr/bin/env bash
set -euo pipefail

concurrently -k -n client,server -c magenta,cyan \
  "vite --config src/dashboard/vite.config.ts --open" \
  "tsx watch tools/dashboard-serve.ts"
