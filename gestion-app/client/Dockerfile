# ─── Client (React/Vite) — imagen multi-stage ────────────────────────────────
# Objetivos:
#   dev  → servidor de Vite con HMR (el código se monta por volumen en compose)
#   prod → build estático servido por Nginx, que además hace de proxy a /api y /uploads

# ─── DEV ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# --host expone Vite en 0.0.0.0 para que sea accesible desde el host
CMD ["npm", "run", "dev", "--", "--host"]

# ─── BUILD (para prod) ───────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
# VITE_API_URL se hornea en build. Vacío ('') → URLs relativas (mismo origen).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── PROD (Nginx sirviendo el build) ─────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
