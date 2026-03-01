# Use Node.js as base
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp manually to ensure it's in the PATH
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

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
