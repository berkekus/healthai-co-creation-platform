# ─── Development ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# --host: konteynerin dışından erişilebilmesi için 0.0.0.0'a bind eder
CMD ["npx", "vite", "--host", "--port", "5173"]

# ─── Builder (statik build) ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Prod'da nginx /api prefix'ini backend'e proxy'ler; relative URL yeterli
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Production (nginx) ──────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
