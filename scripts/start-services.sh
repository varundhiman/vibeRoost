#!/bin/bash

# Start all services for local development

echo "Starting Redis..."
docker-compose up -d redis

echo "Waiting for Redis to be ready..."
sleep 5

echo "Starting services..."

# Start each service in the background
echo "Starting User Service on port 8080..."
mvn spring-boot:run -pl user-service &
USER_PID=$!

echo "Starting Community Service on port 8081..."
mvn spring-boot:run -pl community-service &
COMMUNITY_PID=$!

echo "Starting Review Service on port 8082..."
mvn spring-boot:run -pl review-service &
REVIEW_PID=$!

echo "Starting Feed Service on port 8083..."
mvn spring-boot:run -pl feed-service &
FEED_PID=$!

echo "Starting External API Service on port 8084..."
mvn spring-boot:run -pl external-api-service &
EXTERNAL_PID=$!

echo "All services started!"
echo "User Service PID: $USER_PID"
echo "Community Service PID: $COMMUNITY_PID"
echo "Review Service PID: $REVIEW_PID"
echo "Feed Service PID: $FEED_PID"
echo "External API Service PID: $EXTERNAL_PID"

echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $USER_PID $COMMUNITY_PID $REVIEW_PID $FEED_PID $EXTERNAL_PID 2>/dev/null
    docker-compose down
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait