# Build stage
FROM node:20.19.6-slim AS builder

# Build arguments for API URL (use empty string to use relative paths)
ARG VITE_API_URL=""

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install backend dependencies
RUN npm ci

# Copy frontend and install dependencies
COPY frontend ./frontend
RUN cd frontend && npm install

# Copy source code
COPY src ./src
COPY migrations ./migrations
COPY script ./script

# Build backend and frontend with API URL
# If VITE_API_URL is set, use it; otherwise use relative paths for same-origin
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build:all

# Production stage
FROM node:20.19.6-slim AS production

WORKDIR /app

# Install dumb-init and OpenSSH for proper signal handling and SSH
RUN apt-get update && apt-get install -y dumb-init openssh-client && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY . .

# Install production dependencies and rebuild native modules
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force && \
    npm rebuild bcrypt

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/script ./script

# Create logs and .ssh directories
RUN mkdir -p logs /app/.ssh

# Generate SSH key pair for KVM host connections
RUN ssh-keygen -t ed25519 -f /app/.ssh/id_ed25519 -N "" -C "kvm-ui@$(hostname)" && \
    chmod 700 /app/.ssh && \
    chmod 600 /app/.ssh/id_ed25519 && \
    chmod 644 /app/.ssh/id_ed25519.pub && \
    echo "========================================" && \
    echo "SSH KEY GENERATED FOR KVM HOST ACCESS" && \
    echo "========================================" && \
    echo "" && \
    echo "Public Key (add this to your KVM host's ~/.ssh/authorized_keys):" && \
    echo "" && \
    cat /app/.ssh/id_ed25519.pub && \
    echo "" && \
    echo "========================================" && \
    echo "Private key stored at: /app/.ssh/id_ed25519" && \
    echo "========================================"

# Set permissions
RUN chmod +x /app/script/*.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]