#!/bin/bash

# This script helps DigitalOcean App Platform start the correct app in a monorepo
# Default to apps/web if APP_DIR is not specified
APP_DIR=${APP_DIR:-apps/web}

echo "Starting app in directory: $APP_DIR"

# Change to the app directory
cd $APP_DIR

# Start the application using the configured start script
# DigitalOcean will set PORT=8080
npm start
