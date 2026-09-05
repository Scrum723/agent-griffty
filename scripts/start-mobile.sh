#!/usr/bin/env bash
set -e

echo "=== Starting Griffty for Mobile / Remote Monitoring ==="
echo "1. Starting backend API on :8787..."
echo "2. Starting dashboard on :5173..."

# Start background server & dashboard
npm run dev:server > /tmp/griffty-server.log 2>&1 &
SERVER_PID=$!
npm run dev:dashboard -- --host 0.0.0.0 > /tmp/griffty-dashboard.log 2>&1 &
DASHBOARD_PID=$!

sleep 3

echo ""
echo "✅ Local Dashboard: http://localhost:5173"
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo "📱 Local Wi-Fi Mobile URL: http://${LOCAL_IP}:5173"
echo ""
echo "--- REMOTE ACCESS FOR THIS WEEKEND ---"
echo "To access from outside your home on iPhone cellular:"
echo "Option A (Instant Cloudflare Tunnel):"
echo "  npx cloudflared tunnel --url http://localhost:5173"
echo ""
echo "Option B (Instant LocalTunnel):"
echo "  npx localtunnel --port 5173"
echo ""
echo "When opened in Safari on iPhone: Tap Share -> 'Add to Home Screen' for standalone iOS app!"

wait
