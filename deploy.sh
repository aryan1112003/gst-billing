#!/bin/bash
# =============================================================
# ERP Billing System — Server Deployment Script
# Run this ON THE SERVER after SSH-ing in.
# Usage: bash deploy.sh
# =============================================================
set -e

APP_DIR="/home/ec2-user/gst-billing"
SERVER_IP="98.90.13.118"
REPO_URL="https://github.com/aryan1112003/gst-billing.git"

echo ""
echo "======================================================"
echo "  ERP Billing System — Deploying..."
echo "======================================================"
echo ""

# ── 1. Clone or pull latest code ──────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "📥  Pulling latest changes from GitHub..."
  cd "$APP_DIR"
  git pull origin master
else
  echo "📦  Cloning repository from GitHub..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

cd "$APP_DIR"

# ── 2. Backend setup ──────────────────────────────────────
echo ""
echo "⚙️   Setting up backend..."
cd "$APP_DIR/backend"

# Verify .env exists (it's gitignored — must be on server separately)
if [ ! -f .env ]; then
  echo ""
  echo "❌  ERROR: backend/.env not found!"
  echo "    Create it before deploying:"
  echo "    nano $APP_DIR/backend/.env"
  echo "    (Copy values from backend/.env.example and fill in your real values)"
  echo ""
  exit 1
fi

# Install only production dependencies
npm install --omit=dev

# Build TypeScript → dist/
npm run build

# Ensure logs directory exists
mkdir -p logs

# ── 3. Start backend with PM2 ─────────────────────────────
echo ""
echo "🔧  Starting backend with PM2..."
pm2 stop erp-api   2>/dev/null || true
pm2 delete erp-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# ── 4. Frontend build ────────────────────────────────────
echo ""
echo "🎨  Building frontend (Expo web)..."
cd "$APP_DIR/frontend"

npm install

# Install 'serve' globally for serving static files (if not already installed)
if ! command -v serve &> /dev/null; then
  echo "Installing 'serve' globally..."
  npm install -g serve
fi

# Export Expo web to dist/
npx expo export --platform web --output-dir dist 2>&1 | tail -20

# ── 5. Serve frontend with PM2 ────────────────────────────
echo ""
echo "🌐  Starting frontend with PM2..."
pm2 stop erp-frontend   2>/dev/null || true
pm2 delete erp-frontend 2>/dev/null || true
pm2 start "serve dist -l 8081 -s" --name erp-frontend
pm2 save

# ── 6. Enable PM2 on server reboot ───────────────────────
pm2 startup 2>/dev/null || echo "(Note: run 'sudo pm2 startup' manually if needed)"
pm2 save

# ── Done ─────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  ✅  Deployment Complete!"
echo "======================================================"
echo ""
echo "  🖥️   Backend API :  http://$SERVER_IP:8001/health"
echo "  🌐  Frontend    :  http://$SERVER_IP:8081"
echo ""
echo "  PM2 Status:"
pm2 status
echo ""
echo "  Logs:"
echo "    pm2 logs erp-api      (backend logs)"
echo "    pm2 logs erp-frontend (frontend logs)"
echo "======================================================"
