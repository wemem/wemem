FROM node:20-bookworm-slim

COPY ./packages/backend/server /app
COPY ./packages/frontend/apps/web/dist /app/static/selfhost
COPY ./packages/frontend/admin/dist /app/static/admin
COPY ./packages/frontend/apps/mobile/dist /app/static/mobile/selfhost
WORKDIR /app

RUN apt-get update && \
  apt-get install -y --no-install-recommends openssl && \
  rm -rf /var/lib/apt/lists/*

CMD yarn predeploy && node --import ./scripts/register.js ./dist/index.js
