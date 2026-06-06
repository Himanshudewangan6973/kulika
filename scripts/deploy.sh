#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Deploying Kulika to Vercel..."

# Check dependencies
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
  exit 1
fi

# Build
echo "📦 Building application..."
npm run build

# Deploy
echo "🌐 Deploying to Vercel..."
vercel deploy --prod

# Run migrations
echo "🗄️ Running database migrations..."
vercel env pull
npm run migrate

# Warm up
echo "🔥 Warming up..."
curl -s https://$(vercel ls --json | jq -r '.[0].url') > /dev/null

echo "✅ Deployment complete!"
