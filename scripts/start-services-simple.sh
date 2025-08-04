#!/bin/bash

# Simple startup script for Supabase Edge Functions

echo "Starting Supabase local development environment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Start Supabase local development
echo "Starting Supabase services..."
supabase start

echo "Supabase services started!"
echo "- Database: http://localhost:54322"
echo "- API Gateway: http://localhost:54321"
echo "- Dashboard: http://localhost:54323"
echo "- Edge Functions: http://localhost:54321/functions/v1"

echo ""
echo "Available Edge Functions:"
echo "- /functions/v1/users"
echo "- /functions/v1/communities" 
echo "- /functions/v1/reviews"
echo "- /functions/v1/feed"
echo "- /functions/v1/external-apis"

echo ""
echo "To stop services, run: supabase stop"