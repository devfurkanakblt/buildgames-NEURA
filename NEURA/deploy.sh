#!/bin/bash
set -e

echo "🚀 Starting Neura Stack Deployment..."

# 1. Pull latest changes
echo "📦 Pulling latest code..."
git pull origin main

# 2. Rebuild and start containers in detached mode
echo "🐳 Rebuilding and starting Docker containers..."
docker-compose down
docker-compose up -d --build

# 3. Clean up unused images to save space
echo "🧹 Cleaning up dangling images..."
docker image prune -f

echo "✅ Deployment Successful! Services are now running."
