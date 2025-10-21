# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with forced architecture compatibility
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Force rebuild of problematic native modules for musl compatibility
RUN npm rebuild lightningcss --platform=linux --arch=x64 --libc=musl || true
RUN npm rebuild @vitejs/plugin-react --platform=linux --arch=x64 --libc=musl || true

# Additional cleanup to ensure compatibility
RUN npm cache clean --force

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create logs directory
RUN mkdir -p /var/log/nginx

# Expose ports
EXPOSE 80 443

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
