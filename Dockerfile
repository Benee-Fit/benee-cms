FROM node:20-alpine AS base

# Install dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++ libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY ./apps/web/package*.json ./apps/web/
COPY ./apps/api/package*.json ./apps/api/
COPY ./apps/app/package*.json ./apps/app/

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Set default app directory
ENV APP_DIR=apps/web

# Build the application
RUN cd ${APP_DIR} && npm run build

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["./do-startup.sh"]
