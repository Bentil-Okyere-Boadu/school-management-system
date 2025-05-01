# Development container with hot reloading
FROM node:21-alpine

WORKDIR /src

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies)
RUN npm install

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start"]