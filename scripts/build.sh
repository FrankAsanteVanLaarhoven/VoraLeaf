#!/usr/bin/env bash
set -euo pipefail
node scripts/generate-db.mjs
VORALEAF_SITES_BUILD=1 node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/build-worker.mjs
node scripts/validate-worker.mjs
