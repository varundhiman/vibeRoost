#!/bin/bash
set -e

echo "🚀 Starting VibeRoost build for Netlify..."

# Build frontend-shared library
echo "📦 Building frontend-shared library..."
cd frontend-shared
npm install
npm run build
cd ..

# Build web-app
echo "🌐 Building web application..."
cd web-app
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"