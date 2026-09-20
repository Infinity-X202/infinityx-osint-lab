#!/usr/bin/env bash
set -euo pipefail
if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run: sudo ./uninstall.sh"
  exit 1
fi
rm -f /usr/local/bin/infinityx /usr/bin/infinityx
rm -rf /usr/share/infinityx
echo "infinityx removed."
