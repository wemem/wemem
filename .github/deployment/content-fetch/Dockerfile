FROM node:20.17.0

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV LAUNCH_HEADLESS=true

COPY ./node_modules /app/node_modules

# rebuild cld to fix the error:
#
# /app/packages/backend/content-fetch# node --import ./scripts/register.js ./dist/index.js   
# node:internal/modules/cjs/loader:1586
# return process.dlopen(module, path.toNamespacedPath(filename));
# Error: /app/node_modules/cld/build/Release/cld.node: cannot open shared object file: No such file or directory
#     at Module._extensions..node (node:internal/modules/cjs/loader:1586:18)
#     at Module.load (node:internal/modules/cjs/loader:1288:32)
#     at Module._load (node:internal/modules/cjs/loader:1104:12)
#     at Module.require (node:internal/modules/cjs/loader:1311:19)
#     at require (node:internal/modules/helpers:179:18)
#     at Object.<anonymous> (/app/node_modules/cld/index.js:2:14)
#     at Module._compile (node:internal/modules/cjs/loader:1469:14)
#     at Module._extensions..js (node:internal/modules/cjs/loader:1548:10)
#     at Module.load (node:internal/modules/cjs/loader:1288:32)
#     at Module._load (node:internal/modules/cjs/loader:1104:12) {
#   code: 'ERR_DLOPEN_FAILED'
#  }
# was compiled against a different cpu architecture.
# case 1: github action build source in x86_64 and run in mac arm64
RUN cd /app/node_modules/cld && npm rebuild --build-from-source

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
