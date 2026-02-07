#!/bin/bash

echo "=========================================="
echo "HSTS Cache Clear Instructions"
echo "=========================================="
echo ""
echo "Your browser has cached HSTS settings for 139.99.122.135"
echo "This is forcing HTTPS even though the server uses HTTP."
echo ""
echo "TO FIX THIS, YOU MUST CLEAR BROWSER HSTS CACHE:"
echo ""
echo "CHROME/EDGE:"
echo "  1. Go to: chrome://net-internals/#hsts"
echo "  2. Scroll to 'Delete domain security policies'"
echo "  3. Enter: 139.99.122.135"
echo "  4. Click Delete"
echo "  5. Close ALL browser windows"
echo "  6. Reopen and try: http://139.99.122.135:3000"
echo ""
echo "FIREFOX:"
echo "  1. Clear browser history (Ctrl+Shift+Del)"
echo "  2. Check 'Site Preferences' or 'Active Logins'"
echo "  3. Time range: 'All Time'"
echo "  4. Click Clear Now"
echo "  5. Close ALL browser windows"
echo "  6. Reopen and try: http://139.99.122.135:3000"
echo ""
echo "QUICK TEST (ignores HSTS):"
echo "  curl http://139.99.122.135:3000/session-status"
echo ""
echo "=========================================="
echo ""

# Stop dev server
echo "Stopping dev server..."
pkill -f "tsx watch src/server.ts" 2>/dev/null
sleep 2

# Start fresh with NODE_ENV=development
echo "Starting dev server with NODE_ENV=development..."
NODE_ENV=development npm run dev &
echo ""
echo "Server started! Check logs with: tail -f /tmp/kvm-ui-dev.log"
echo ""
