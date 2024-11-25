FROM node:20.17.0

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV LAUNCH_HEADLESS=true

COPY ./node_modules /app/node_modules
COPY ./package.json /app/package.json
# COPY ./.yarn /app/.yarn
COPY ./yarn.lock /app/yarn.lock
# COPY ./.yarnrc.yml /app/.yarnrc.yml
COPY ./packages/backend/content-fetch /app/packages/backend/content-fetch
COPY ./packages/backend/content-handler /app/packages/backend/content-handler
COPY ./packages/backend/readabilityjs /app/packages/backend/readabilityjs

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
