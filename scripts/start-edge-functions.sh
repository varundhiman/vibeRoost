#!/bin/bash

# Start Supabase Edge Functions locally
echo "Starting Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Start Supabase local development
echo "Starting Supabase local development environment..."
supabase start

# Serve the Edge Functions
echo "Serving Edge Functions..."
supabase functions serve --env-file .env.backend

echo "Edge Functions are now running!"
echo "Access them at: http://localhost:54321/functions/v1/"