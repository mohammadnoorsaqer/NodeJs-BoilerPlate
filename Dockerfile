# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /usr/src/app
# Needed by some native deps (bcryptjs is pure JS so this is just safety for future deps)
RUN apk add --no-cache libc6-compat

# ---------- Dependencies (cached layer) ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---------- Dev dependencies (used for build/lint stage only) ----------
FROM base AS deps-dev
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Build / lint stage (used by CI, not shipped) ----------
FROM deps-dev AS build
COPY . .
RUN npm run lint && npm run prettier

# ---------- Production image ----------
FROM base AS runner
ENV NODE_ENV=production
# Run as non-root user
RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs && chown -R nodeapp:nodejs /usr/src/app

USER nodeapp

EXPOSE 3000

CMD ["node", "src/server.js"]