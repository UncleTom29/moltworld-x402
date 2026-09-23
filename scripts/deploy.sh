#!/usr/bin/env bash
set -e

TARGET="${1:-worker}"

echo "======================================================"
echo " Moltworld Deployment Pipeline: Target [$TARGET]"
echo "======================================================"

echo "Step 1: Running type checks..."
pnpm run build

echo "Step 2: Running automated tests..."
pnpm test

if [ "$TARGET" = "worker" ]; then
  echo "Step 3: Deploying to Cloudflare Workers for moltworld.xyz..."
  if ! command -v wrangler &> /dev/null && ! pnpm wrangler --version &> /dev/null; then
    echo "Installing wrangler..."
    pnpm add -D wrangler
  fi
  pnpm wrangler deploy
elif [ "$TARGET" = "contabo" ]; then
  echo "Step 3: Deploying directly to Contabo VPS (95.111.229.139)..."
  ssh root@95.111.229.139 "cd /opt/moltworld && git pull origin main && pnpm install --frozen-lockfile && pnpm build && systemctl restart moltworld"
  echo "Moltworld updated and running on Contabo VPS (port 3402)!"
else
  echo "Unknown target: $TARGET. Use 'worker' or 'contabo'."
  exit 1
fi

echo "======================================================"
echo " Deployment completed successfully!"
echo "======================================================"
