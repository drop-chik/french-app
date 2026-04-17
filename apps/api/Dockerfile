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

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @french-app/shared-types build
RUN pnpm --filter @french-app/srs-engine build

# Build API
RUN pnpm --filter api build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/server.js"]
