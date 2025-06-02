#!/bin/bash

# This script helps DigitalOcean App Platform build and start the correct app in a monorepo
# Default to apps/web if APP_DIR is not specified
APP_DIR=${APP_DIR:-apps/web}

echo "Building and starting app in directory: $APP_DIR"

# Install dependencies at the root level if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Change to the app directory
cd $APP_DIR

# Build the app first
echo "Building the application..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
  echo "Error: Build failed or .next directory not found."
  exit 1
fi

# Start the application using the configured start script
# DigitalOcean will set PORT=8080
echo "Starting the application..."
npm start
