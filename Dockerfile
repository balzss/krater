FROM node:22-alpine AS base
WORKDIR /app
# Copy package.json and lock file first for better caching
COPY package*.json ./
# Set NODE_ENV to production for the final image
ENV NODE_ENV=production
# Install ONLY production dependencies for the final, lean image
RUN npm ci --omit=dev && npm cache clean --force


# ---- Builder Stage (for building the app) ----
# Use the same base image
FROM node:22-alpine AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install ALL dependencies (including devDependencies) needed for the build
# Using npm ci ensures we install based on the lock file
RUN npm ci && npm cache clean --force
# Copy the rest of the application code
COPY . .
# Set build-time environment variables if needed (uncomment and pass via --build-arg if required)
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Run the build command
RUN npm run build


# ---- Runner Stage (final image) ----
# Start from the lean base image with production dependencies
FROM base AS runner
WORKDIR /app

# Copy built artifacts from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Copy node_modules from the base stage (contains only production deps)
COPY --from=base /app/node_modules ./node_modules
# package.json is needed to run `next start`
COPY package.json ./package.json

# Expose the port Next.js runs on (default 3000)
EXPOSE 3000

# Define the command to run your app
# Use "node server.js" if you have a custom server
CMD ["npm", "start"]


