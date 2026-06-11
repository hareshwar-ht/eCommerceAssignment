FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose API port
EXPOSE 8000

# Set environment defaults
ENV NODE_ENV=production

# Start the server
CMD [ "npm", "start" ]
