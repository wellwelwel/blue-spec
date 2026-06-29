#!/usr/bin/env bash
set -euo pipefail

bash scripts/build.sh

deno run -A npm:poku
