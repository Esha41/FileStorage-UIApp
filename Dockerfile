# Build the Angular application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# List build output to verify
RUN echo "Checking build output..." && \
    ls -la /app/dist/ && \
    ls -la /app/dist/file-storage-client/ && \
    ls -la /app/dist/file-storage-client/browser/ || \
    (echo "ERROR: Build output directory not found!" && exit 1)

# Serve the application with nginx
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist/file-storage-client/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

