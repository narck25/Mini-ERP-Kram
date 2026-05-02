FROM node:18-alpine

# Install OpenSSL for Prisma PostgreSQL connection
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and Prisma schema (prisma needed for postinstall hook)
COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (postinstall will run prisma generate automatically)
RUN npm install

# Copy application code
COPY src ./src

# Create uploads directories
RUN mkdir -p uploads/cvs uploads/employee-documents uploads/psych-tests uploads/purchase-quotes uploads/temp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command: run migrations, seed data, then start server
CMD npx prisma migrate deploy && node prisma/seed.js && node src/index.js
