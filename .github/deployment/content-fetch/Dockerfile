FROM node:20-bookworm-slim

COPY ./node_modules /app/node_modules
COPY ./packages/backend/content-fetch /app/packages/backend/content-fetch
COPY ./packages/backend/content-handler /app/packages/backend/content-handler

RUN apt-get update && \
  apt-get install -y --no-install-recommends openssl && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app/packages/backend/content-fetch

CMD node --import ./scripts/register.js ./dist/index.js
