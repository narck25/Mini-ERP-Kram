FROM node:18-alpine

# Coolify build arguments (declared explicitly to avoid injection issues)
ARG COOLIFY_FQDN
ARG DATABASE_URL
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME
ARG JWT_SECRET
ARG CORS_ORIGIN
ARG BASE_URL
ARG NEXT_PUBLIC_API_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for prisma generate)
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY src ./src

# Create uploads directories
RUN mkdir -p uploads/cvs uploads/employee-documents uploads/psych-tests uploads/purchase-quotes uploads/temp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command: run migrations then start server
CMD npx prisma migrate deploy && node src/index.js
