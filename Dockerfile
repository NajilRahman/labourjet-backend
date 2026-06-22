# Use official Node.js long term support image (Alpine version for smaller size)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the backend port (5000)
EXPOSE 5000

# Command to start the application
CMD ["npm", "start"]
