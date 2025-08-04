#!/bin/bash

# Load environment variables
if [ -f .env.backend ]; then
    export $(cat .env.backend | grep -v '^#' | xargs)
    echo "Loaded environment variables from .env.backend"
else
    echo "Warning: .env.backend file not found. Using default values."
fi

echo "Starting Supabase with Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Start Supabase local development
echo "Starting Supabase services..."
supabase start

echo ""
echo "Supabase services started successfully!"
echo "- Database: http://localhost:54322"
echo "- API Gateway: http://localhost:54321"
echo "- Dashboard: http://localhost:54323"
echo "- Edge Functions: http://localhost:54321/functions/v1"
echo ""
echo "Available Edge Functions:"
echo "- Users: http://localhost:54321/functions/v1/users"
echo "- Communities: http://localhost:54321/functions/v1/communities"
echo "- Reviews: http://localhost:54321/functions/v1/reviews"
echo "- Feed: http://localhost:54321/functions/v1/feed"
echo "- External APIs: http://localhost:54321/functions/v1/external-apis"
echo ""
echo "Frontend can connect to: http://localhost:54321/functions/v1"
echo ""
echo "To stop services, run: supabase stop"