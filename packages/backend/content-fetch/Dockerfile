FROM node:18.20.4
# FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:18.20.4
LABEL org.opencontainers.image.source="https://github.com/wemem/wemem"

# Installs latest Chromium (92) package.
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    nodejs \
    yarn \
    g++ \
    make \
    python3 \
    dbus
RUN dbus-daemon --system  --print-address
WORKDIR /app

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV LAUNCH_HEADLESS=true
ENV HUSKY=0
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV SENTRYCLI_SKIP_DOWNLOAD=1
ENV YARN_ENABLE_SCRIPTS=0
ENV DEBUG=*

COPY . .

RUN npm install -g typescript

RUN yarn workspaces focus @wemem/content-fetch

RUN rm -rf packages/backend/content-handler/dist
RUN rm -rf packages/backend/content-fetch/dist

RUN yarn workspace @wemem/content-handler build
RUN yarn workspace @wemem/content-fetch build

EXPOSE 3020

WORKDIR /app/packages/backend/content-fetch

CMD ["node", "--import", "./scripts/register.js", "./dist/index.js"]

