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

# Create a simple health check server on port 8080
create_health_server() {
  echo "Creating fallback health check server on port $PORT"
  # Use a basic node HTTP server to respond to health checks
  cat > health-server.js << 'EOF'
  const http = require('http');
  const PORT = process.env.PORT || 8080;
  
  const server = http.createServer((req, res) => {
    console.log(`Health check received at ${new Date().toISOString()}`);
    res.writeHead(200);
    res.end('OK');
  });
  
  server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
  });
  
  // Handle signals gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down health server');
    server.close(() => process.exit(0));
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down health server');
    server.close(() => process.exit(0));
  });
EOF

  # Start the health server
  node health-server.js &
  echo "Health check server started with PID $!"
}

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
    
    # Start health check server as fallback to keep container alive
    create_health_server
    exit 1
  fi
  
  cd $APP_DIR
  echo "Changed to app directory: $(pwd)"
  echo "Listing app directory:"
  ls -la
  
  # Verify next.config.js or next.config.ts exists and check its content
  if [ -f "next.config.js" ]; then
    echo "Found next.config.js:"
    cat next.config.js
  elif [ -f "next.config.ts" ]; then
    echo "Found next.config.ts:"
    cat next.config.ts
  else
    echo "Warning: No Next.js config file found"
  fi
  
  # For standalone output, the server should be in .next/standalone
  if [ -d ".next/standalone" ]; then
    echo "Using standalone output mode"
    # Copy the package.json for reference (might be needed by the server)
    cp package.json .next/standalone/ 2>/dev/null || echo "Warning: Could not copy package.json"
    
    # Copy next.config.js to standalone if it exists
    if [ -f "next.config.js" ]; then
      cp next.config.js .next/standalone/ 2>/dev/null || echo "Warning: Could not copy next.config.js"
    fi
    
    cd .next/standalone
    echo "Changed to standalone directory: $(pwd)"
    echo "Listing standalone directory:"
    ls -la
    
    # Make sure server.js exists
    if [ ! -f "server.js" ]; then
      echo "Error: server.js not found in standalone directory"
      cd $WORKSPACE_DIR
      create_health_server
      exit 1
    fi
    
    # Check the server.js file
    echo "server.js content:"
    head -n 20 server.js
    
    # Set NODE_ENV to production explicitly
    export NODE_ENV=production
    
    # Start the health check server as a backup
    cd $WORKSPACE_DIR
    create_health_server
    
    # Go back to the standalone directory
    cd $APP_DIR/.next/standalone
    
    echo "Starting server with: node server.js"
    # Start the app with node
    node server.js &
    APP_PID=$!
    echo "App started with PID $APP_PID"
    
    # Wait for both processes
    wait
  else
    echo "Standalone directory not found, checking for .next directory"
    
    if [ -d ".next" ]; then
      echo "Found .next directory, starting with next start"
      # Start the health check server as a backup
      cd $WORKSPACE_DIR
      create_health_server
      
      # Go back and start the Next.js app
      cd $APP_DIR
      # Use node_modules/.bin/next to ensure we're using the local next binary
      if [ -f "node_modules/.bin/next" ]; then
        echo "Starting with local next binary"
        NODE_ENV=production node_modules/.bin/next start -p $PORT &
      else
        echo "Local next binary not found, using global next"
        NODE_ENV=production next start -p $PORT &
      fi
      APP_PID=$!
      echo "App started with PID $APP_PID"
      
      # Wait for both processes
      wait
    else
      echo "Error: Neither .next/standalone nor .next directory found"
      echo "Current directory contents:"
      ls -la
      
      # Start health check server as fallback
      cd $WORKSPACE_DIR
      create_health_server
      sleep infinity
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
