#!/bin/bash
# Deployment script for LiteLLM proxy and Client Portal

set -e

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
ssh -i ~/.ssh/vast_id_ed25519 root@74.208.193.3 "cd /root/litellm && git pull origin main"

# 4. Deploy Client Portal (Next.js with PM2)
echo "abc Deploying Client Portal..."
ssh -i ~/.ssh/vast_id_ed25519 root@74.208.193.3 "bash -s" << 'EOF'
    set -e
    cd /root/litellm
    
    # Check for .env.local, copy from example if missing (optional safety)
    # cp .env.example .env.local 2>/dev/null || true

    echo "🧹 Cleaning cache..."
    rm -rf .next
    rm -rf node_modules

    echo "📦 Installing dependencies..."
    npm install

    # Run migrations if any (currently none detected, but placeholder for future)
    # npx prisma migrate deploy 

    echo "🏗 Building Next.js app..."
    npm run build

    echo "🚀 Restarting PM2 process..."
    # Check if process exists, if not start it, else restart
    if pm2 list | grep -q "client-portal"; then
        pm2 restart client-portal
    else
        pm2 start npm --name "client-portal" -- start -- -p 3004
    fi
    
    pm2 save
EOF

echo "✅ Deployment comddplete!"
