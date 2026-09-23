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
elif [ "$TARGET" = "docker" ]; then
  echo "Step 3: Building and starting Docker container..."
  docker compose build
  docker compose up -d
  echo "Moltworld container running on http://localhost:3000"
else
  echo "Unknown target: $TARGET. Use 'worker' or 'docker'."
  exit 1
fi

echo "======================================================"
echo " Deployment completed successfully!"
echo "======================================================"
