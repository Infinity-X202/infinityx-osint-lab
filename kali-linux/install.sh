#!/usr/bin/env bash
# INFINITY X — works on Kali AND WSL, with or without sudo
set -euo pipefail

RED='\033[1;31m'
BLU='\033[1;34m'
GRN='\033[1;32m'
YEL='\033[1;33m'
NC='\033[0m'

echo -e "${RED}INFINITY X${NC} ${BLU}KALI / WSL OSINT LAB${NC}"

ROOT="$(cd "$(dirname "$0")" && pwd)"
PY="$ROOT/infinityx.py"
DATA="$ROOT/data"

if [[ ! -f "$PY" ]]; then
  echo -e "${RED}infinityx.py not found in:${NC} $ROOT"
  echo "You must clone the repo first:"
  echo -e "  ${BLU}git clone https://github.com/Infinity-X202/infinityx-osint-lab.git${NC}"
  echo -e "  ${BLU}cd infinityx-osint-lab/kali-linux${NC}"
  echo -e "  ${BLU}bash install.sh${NC}"
  exit 1
fi

command -v python3 >/dev/null || { echo -e "${RED}python3 is required${NC}  sudo apt install -y python3"; exit 1; }
chmod +x "$PY" 2>/dev/null || true

if [[ "$(id -u)" -eq 0 ]]; then
  SHARE="/usr/share/infinityx"
  BIN="/usr/local/bin/infinityx"
  mkdir -p "$SHARE/data" "$(dirname "$BIN")"
  install -m 0755 "$PY" "$SHARE/infinityx.py"
  cp -a "$DATA/." "$SHARE/data/" 2>/dev/null || true
  cat > "$BIN" <<'EOF'
#!/usr/bin/env bash
exec python3 /usr/share/infinityx/infinityx.py "$@"
EOF
  chmod 0755 "$BIN"
  ln -sf "$BIN" /usr/bin/infinityx 2>/dev/null || true
  echo -e "${GRN}Installed system-wide.${NC}"
else
  SHARE="$HOME/.local/share/infinityx"
  BINDIR="$HOME/.local/bin"
  mkdir -p "$SHARE/data" "$BINDIR"
  install -m 0755 "$PY" "$SHARE/infinityx.py"
  cp -a "$DATA/." "$SHARE/data/" 2>/dev/null || true
  cat > "$BINDIR/infinityx" <<EOF
#!/usr/bin/env bash
exec python3 "$SHARE/infinityx.py" "\$@"
EOF
  chmod 0755 "$BINDIR/infinityx"
  echo -e "${GRN}Installed for user ${USER} (no sudo).${NC}"
  if ! echo ":$PATH:" | grep -q ":$BINDIR:"; then
    SHELL_RC="$HOME/.zshrc"
    [[ -f "$HOME/.bashrc" && ! -f "$HOME/.zshrc" ]] && SHELL_RC="$HOME/.bashrc"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$SHELL_RC"
    export PATH="$BINDIR:$PATH"
    echo -e "${YEL}Added ~/.local/bin to PATH in ${SHELL_RC}${NC}"
    echo -e "Run: ${BLU}source ${SHELL_RC}${NC}   then   ${BLU}infinityx${NC}"
  fi
fi

echo
echo -e "${GRN}Start now (works even before PATH refresh):${NC}"
echo -e "  ${BLU}python3 \"$PY\"${NC}"
echo -e "  ${BLU}infinityx${NC}"
echo -e "  ${BLU}infinityx search \"MUHAMMAD ASLAM\"${NC}"
echo
echo -e "${RED}DATABASE HACKED BY INFINITY X${NC}"
