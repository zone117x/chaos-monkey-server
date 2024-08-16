# Stage 1: Build the application
FROM node:lts-slim AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:lts-slim

# Set working directory inside the container
WORKDIR /app

# Copy only the necessary files and dependencies for runtime
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production

# Expose the port
EXPOSE 9222

# Command to run the application
CMD ["node", "dist/index.js"]
