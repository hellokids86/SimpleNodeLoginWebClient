# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from build stage
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/data/sessions.db

EXPOSE 3001

CMD ["node", "dist/server.js"]
