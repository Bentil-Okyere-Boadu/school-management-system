# Build stage
FROM node:22-alpine AS builder
WORKDIR /
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /dist ./dist
COPY --from=builder /package*.json ./

RUN npm run seed:reset
EXPOSE 5000
CMD ["npm", "run", "start:prod"]