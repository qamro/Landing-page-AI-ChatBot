FROM node:20-slim
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node","dist/index.js"]
