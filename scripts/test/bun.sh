#!/usr/bin/env bash
set -euo pipefail

bash scripts/build.sh

bun --bun poku
