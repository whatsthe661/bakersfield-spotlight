#!/bin/bash
# ============================================================
# Local HTTPS dev server for Kern County Museum AR
# Camera access requires HTTPS even on localhost.
# ============================================================

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
  echo ""
  echo "  mkcert not found — installing via Homebrew..."
  echo ""
  brew install mkcert
  mkcert -install
fi

# Generate local certs if they don't exist
if [ ! -f localhost.pem ]; then
  echo ""
  echo "  Generating local HTTPS certificate..."
  echo ""
  mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
fi

# Get local IP for QR code access from phone
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo ""
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║   Kern County Museum — AR Experience Server      ║"
echo "  ╠══════════════════════════════════════════════════╣"
echo "  ║                                                  ║"
echo "  ║   Local:   https://localhost:8443                ║"
echo "  ║   Network: https://${LOCAL_IP}:8443              ║"
echo "  ║                                                  ║"
echo "  ║   To test on your iPhone:                        ║"
echo "  ║   1. Connect phone to same WiFi                  ║"
echo "  ║   2. Open Safari to the Network URL above        ║"
echo "  ║   3. Accept the certificate warning              ║"
echo "  ║                                                  ║"
echo "  ║   Station URLs:                                  ║"
echo "  ║   .../ar-app.html?station=schoolhouse            ║"
echo "  ║   .../ar-app.html?station=barn                   ║"
echo "  ║   .../ar-app.html?station=oil-derrick            ║"
echo "  ║                                                  ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo ""

# Check for Python 3 http.server with SSL
if command -v python3 &> /dev/null; then
  python3 -c "
import http.server
import ssl

server_address = ('0.0.0.0', 8443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain('localhost.pem', 'localhost-key.pem')
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print('  Serving on https://0.0.0.0:8443 — press Ctrl+C to stop')
httpd.serve_forever()
"
else
  echo "  Python 3 is required. Install it or use npx serve instead."
  echo ""
  echo "  Alternative: npx serve --ssl-cert localhost.pem --ssl-key localhost-key.pem -l 8443"
fi
