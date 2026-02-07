FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose the port Vite runs on
EXPOSE 3000

# Start the app in development mode, accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host"]