FROM node:18.20.4

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV LAUNCH_HEADLESS=true

COPY ./node_modules /app/node_modules
COPY ./packages/backend/content-fetch /app/packages/backend/content-fetch
COPY ./packages/backend/content-handler /app/packages/backend/content-handler

RUN apt-get update && \
  apt-get install -y --no-install-recommends openssl \
  chromium \
  ca-certificates \
  nodejs \
  yarn \
  g++ \
  make \
  python3 \
  dbus
RUN dbus-daemon --system  --print-address&& \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app/packages/backend/content-fetch

CMD node --import ./scripts/register.js ./dist/index.js
