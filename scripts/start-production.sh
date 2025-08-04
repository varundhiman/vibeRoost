#!/bin/bash

# Social Recommendation App - Production Startup Script
# This script starts the frontend connected to production Supabase

set -e

echo "🚀 Starting Social Recommendation App (Production Mode)"
echo "=================================================="

# Check if we're linked to production
if ! supabase status --project-ref ovjsvutuyfuiomgwbfzt &>/dev/null; then
    echo "⚠️  Not linked to production Supabase project."
    echo "Run the following command first:"
    echo "supabase link --project-ref ovjsvutuyfuiomgwbfzt"
    exit 1
fi

echo "✅ Connected to production Supabase project"

# Build frontend shared library
echo "📦 Building frontend shared library..."
cd frontend-shared
npm install
npm run build
cd ..

echo "✅ Frontend shared library built"

# Start the web app
echo "🌐 Starting web application..."
echo "Frontend will be available at: http://localhost:3000"
echo "Supabase Dashboard: https://supabase.com/dashboard/project/ovjsvutuyfuiomgwbfzt"
echo ""
echo "Press Ctrl+C to stop the application"

cd web-app
npm install
npm start