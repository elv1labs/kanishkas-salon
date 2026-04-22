#!/bin/bash
set -e

echo ""
echo "🔨 Building Next.js production bundle..."
npm run build

echo ""
echo "📦 Syncing static chunks to standalone..."
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static

echo ""
echo "🖼️  Syncing public assets to standalone..."
cp -r public/. .next/standalone/public/

echo ""
echo "♻️  Restarting PM2..."
if pm2 describe kanishkas-salon > /dev/null 2>&1; then
  pm2 restart kanishkas-salon
else
  cd .next/standalone && pm2 start server.js --name kanishkas-salon && cd ../..
fi
pm2 save

echo ""
echo "✅ Deploy complete."
echo ""
pm2 status
