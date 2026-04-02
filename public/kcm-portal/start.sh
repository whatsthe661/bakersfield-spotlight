#!/bin/bash
# ============================================================
#  KCM Portal to the Past — One-command launcher
#  Just run:  ./start.sh
# ============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │   Kern County Museum — Portal to the Past   │"
echo "  └─────────────────────────────────────────────┘"
echo ""

# --- 1. Check for API key ---
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "  No GEMINI_API_KEY found."
  echo ""
  echo "  Option 1: Create a .env file:"
  echo "    echo 'GEMINI_API_KEY=your_key_here' > .env"
echo ""
echo "  Option 2: Enter it once in the app (gear icon) — saved on this Mac."
echo ""
echo "  Option 3: export GEMINI_API_KEY=your_key_here"
echo ""
echo "  Get a key at: https://aistudio.google.com/apikey"
echo ""
  read -p "  Paste your Gemini API key now (or press Enter to skip): " key
  if [ -n "$key" ]; then
    echo "GEMINI_API_KEY=$key" > .env
    export GEMINI_API_KEY="$key"
    echo "  Saved to .env"
  else
    echo "  Skipping — server won't be able to generate videos."
    export GEMINI_API_KEY="none"
  fi
fi

# --- 2. Check Node.js ---
if ! command -v node &> /dev/null; then
  echo "  Node.js not found. Installing via Homebrew..."
  if ! command -v brew &> /dev/null; then
    echo "  ERROR: Need Node.js. Install from https://nodejs.org"
    exit 1
  fi
  brew install node
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "  Node.js v18+ required (you have $(node -v))"
  exit 1
fi

# --- 3. Install deps ---
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo "  Installing dependencies..."
  npm install --silent 2>&1 | tail -1
fi

# --- 4. HTTPS certs (include LAN IP so iPhone Safari trusts the site) ---
LOCAL_IP_FOR_CERT=$(ipconfig getifaddr en0 2>/dev/null || true)
if [ ! -f localhost.pem ]; then
  echo "  Setting up HTTPS (required for camera access)..."
  if ! command -v mkcert &> /dev/null; then
    echo "  Installing mkcert..."
    brew install mkcert 2>/dev/null || {
      echo "  ERROR: Need mkcert. Run: brew install mkcert && mkcert -install"
      exit 1
    }
    mkcert -install
  fi
  if [ -n "$LOCAL_IP_FOR_CERT" ]; then
    mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1 "$LOCAL_IP_FOR_CERT"
  else
    mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
  fi
fi

# --- 5. Create data dirs ---
mkdir -p generated
mkdir -p data/captures

# --- 6. Get network IP ---
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo ""
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║                                               ║"
echo "  ║   Open this on your iPhone:                   ║"
echo "  ║                                               ║"
echo "  ║   https://${LOCAL_IP}:8443                     ║"
echo "  ║                                               ║"
echo "  ║   (Same WiFi · Accept cert warning)           ║"
echo "  ║                                               ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo ""

# --- 7. Launch ---
exec node server.js
