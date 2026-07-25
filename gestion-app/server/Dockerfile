# ─── Server (Node/Express) — imagen multi-stage ──────────────────────────────
# Objetivos:
#   dev  → nodemon con hot-reload (el código se monta por volumen en compose)
#   prod → node index.js, imagen mínima con sólo dependencias de producción

# Base común
FROM node:20-alpine AS base
WORKDIR /app
# tini para manejar señales (SIGTERM) correctamente en el contenedor
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# ─── DEV ─────────────────────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development
# nodemon no está en package.json → se instala global en la imagen de dev
RUN npm install -g nodemon
COPY package*.json ./
RUN npm install
# El resto del código llega por bind-mount (ver docker-compose.yml)
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── PROD ────────────────────────────────────────────────────────────────────
FROM base AS prod
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
