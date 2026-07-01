# =====================================================================
# Frontend (React + Vite) — build lalu serve sebagai static via nginx
# =====================================================================

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (butuh devDependencies untuk tsc + vite build)
COPY package.json package-lock.json ./
RUN npm ci

# Salin sisa source dan build
COPY . .

# Base URL backend di-bake saat build (dipakai browser, jadi arahkan ke
# port host yang di-expose oleh service `server` di docker-compose).
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
