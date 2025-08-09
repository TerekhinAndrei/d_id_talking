#!/usr/bin/env bash
set -euo pipefail

# Simple one-shot runner for D-ID direct endpoint tests with real data.
# - Creates/uses isolated venv .venv_did_tests
# - Installs minimal deps
# - Loads D_ID_API_KEY from .env automatically in the python script

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
VENV_DIR="$ROOT_DIR/.venv_did_tests"

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install -q -U pip setuptools wheel >/dev/null
python -m pip install -q requests aiortc==1.7.0 websockets python-dotenv >/dev/null

# Install puppeteer runner deps (Node)
if command -v node >/dev/null 2>&1; then
  (cd "$ROOT_DIR/scripts/puppeteer_runner" && npm install --silent >/dev/null 2>&1 || true)
fi

python "$ROOT_DIR/scripts/run_did_tests.py"

