FROM node:24-bookworm-slim AS base

WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS migration

ENV NODE_ENV=production
RUN npm ci --include=dev && npm cache clean --force

COPY --chown=node:node backend ./backend

USER node
CMD ["npm", "run", "db:migrate"]

FROM base AS api

ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node backend ./backend

USER node
EXPOSE 3000

CMD ["npm", "start"]
