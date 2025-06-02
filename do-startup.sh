#!/bin/bash

# Print full environment for debugging
echo "Environment variables:"
env | sort

# This script helps DigitalOcean App Platform build and start the correct app in a monorepo
# Default to apps/web if APP_DIR is not specified
APP_DIR=${APP_DIR:-apps/web}

echo "Starting app in directory: $APP_DIR"

# Set the PORT environment variable for Next.js
export PORT=${PORT:-8080}
echo "Setting port to: $PORT"

# Determine where we're running
if [ -d "/workspace" ]; then
  echo "Running in DigitalOcean App Platform"
  WORKSPACE_DIR="/workspace"
  cd $WORKSPACE_DIR
  
  echo "Current directory: $(pwd)"
  echo "Listing files:"
  ls -la
  
  # Check if the app directory exists
  if [ ! -d "$APP_DIR" ]; then
    echo "Error: App directory $APP_DIR not found in $(pwd)"
    echo "Available directories:"
    ls -la
    exit 1
  fi
  
  cd $APP_DIR
  echo "Changed to app directory: $(pwd)"
  echo "Listing app directory:"
  ls -la
  
  # For standalone output, the server should be in .next/standalone
  if [ -d ".next/standalone" ]; then
    echo "Using standalone output mode"
    # Copy the package.json for reference (might be needed by the server)
    cp package.json .next/standalone/
    cd .next/standalone
    echo "Changed to standalone directory: $(pwd)"
    echo "Listing standalone directory:"
    ls -la
    
    # Make sure server.js exists
    if [ ! -f "server.js" ]; then
      echo "Error: server.js not found in standalone directory"
      exit 1
    fi
    
    echo "Starting server with: node server.js"
    # Start the app with node
    exec node server.js
  else
    echo "Standalone directory not found, checking for .next directory"
    
    if [ -d ".next" ]; then
      echo "Found .next directory, starting with next start"
      exec next start -p $PORT
    else
      echo "Error: Neither .next/standalone nor .next directory found"
      echo "Current directory contents:"
      ls -la
      exit 1
    fi
  fi
else
  # We're running locally
  echo "Running locally in $(pwd)"
  
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
  fi
  
  cd $APP_DIR
  echo "Changed to app directory: $(pwd)"
  
  # Check if the app is already built
  if [ ! -d ".next" ]; then
    echo "Building the application..."
    npm run build
  fi
  
  echo "Starting the application with npm run start"
  exec npm run start
fi
