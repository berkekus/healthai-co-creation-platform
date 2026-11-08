# ─── Development ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ─── Builder (TypeScript derleme) ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Production ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 5000
# One GC thread: V8 starts a helper per host core, and on a fractional-CPU plan
# they eat the main thread's share. At 0.5 CPU, 300 sign-ups in 10 s went from
# 0 to 289 completed with this flag.
CMD ["node", "--single-threaded-gc", "dist/src/index.js"]
