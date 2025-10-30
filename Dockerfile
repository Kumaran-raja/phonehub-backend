# Use official Node.js 20 Alpine image (small and fast)
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Set environment port
ENV PORT=10000
EXPOSE $PORT

# Start your app
CMD ["node", "index.js"]
