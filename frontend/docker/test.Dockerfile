# Testing container with production-like environment
FROM node:21-alpine AS builder

WORKDIR /src

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:21-alpine AS tester
WORKDIR /src

# Copy built files and dependencies
COPY --from=builder /package.json .
COPY --from=builder /package-lock.json .
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /.next ./.next
COPY --from=builder /public ./public

# Install testing tools
RUN npm install -g wait-on

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:3000', (r) => { \
    if (r.statusCode !== 200) throw new Error('Not healthy') }).end()"

# Run tests
CMD ["sh", "-c", "npm start & wait-on http://localhost:3000 && npm run test"]