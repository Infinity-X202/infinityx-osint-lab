#!/usr/bin/env bash
# Run without installing (Kali / WSL)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$ROOT/infinityx.py" "$@"
