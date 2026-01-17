# Multi-stage build for React + TypeScript + Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_AETHER_API_BASE
ARG VITE_AETHER_API_URL
ARG VITE_AGENT_BUILDER_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_DEV_MODE
ARG VITE_DEV_USERNAME
ARG VITE_DEV_PASSWORD
ARG VITE_AUDIMODAL_API_URL
ARG VITE_AUDIMODAL_API_KEY
ARG VITE_AUDIMODAL_TENANT_ID
ARG VITE_DEEPLAKE_API_URL
ARG VITE_DEEPLAKE_API_KEY

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]