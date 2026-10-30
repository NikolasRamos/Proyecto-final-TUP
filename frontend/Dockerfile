FROM node:24-bookworm-slim AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY frontend ./frontend
RUN npm run build

FROM nginx:1.29-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
