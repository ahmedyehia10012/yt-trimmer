# Use Node.js as base
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip to ensure it's available as a module and binary
RUN python3 -m pip install --break-system-packages yt-dlp

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build frontend
RUN cd frontend && npm install && npm run build

# Expose the port Railway provides
EXPOSE 8080

# Start the monolith server
CMD ["node", "backend/server.js"]
