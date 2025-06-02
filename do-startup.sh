#!/bin/bash

# This script helps DigitalOcean App Platform build and start the correct app in a monorepo
# Default to apps/web if APP_DIR is not specified
APP_DIR=${APP_DIR:-apps/web}

echo "Starting app in directory: $APP_DIR"

# Check if we're in a DigitalOcean App Platform environment
if [ -d "/workspace" ]; then
  # We're in DigitalOcean App Platform - the build has already been done
  echo "Running in DigitalOcean App Platform"
  cd $APP_DIR
  
  # For standalone output, the server is in .next/standalone
  if [ -d ".next/standalone" ]; then
    echo "Using standalone output mode"
    cd .next/standalone
    # Set the PORT environment variable for Next.js
    export PORT=${PORT:-8080}
    # Start the app with node
    node server.js
  else
    echo "Error: Standalone output directory not found."
    exit 1
  fi
else
  # We're running locally
  echo "Running locally"
  
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
  fi
  
  cd $APP_DIR
  
  # Check if the app is already built
  if [ ! -d ".next" ]; then
    echo "Building the application..."
    npm run build
  fi
  
  echo "Starting the application..."
  export PORT=${PORT:-8080}
  npm run start
fi
