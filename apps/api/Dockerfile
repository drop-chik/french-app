FROM node:22-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages/ ./packages/

# Copy api app
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter api build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/server.js"]
