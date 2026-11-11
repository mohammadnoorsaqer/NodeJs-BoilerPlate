# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache libc6-compat

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---------- Lint / typecheck (CI only, not shipped) ----------
FROM base AS verify
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run lint && npm run prettier && npm run typecheck

# ---------- Production image ----------
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
COPY tsconfig.json ./

RUN mkdir -p logs && chown -R nodeapp:nodejs /usr/src/app

USER nodeapp

EXPOSE 3000

CMD ["npm", "start"]
