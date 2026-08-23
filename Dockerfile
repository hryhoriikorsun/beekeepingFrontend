# syntax=docker/dockerfile:1

FROM node:24-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# the API address cannot be handed over at startup: production and staging are
# genuinely different images, built from the same commit.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build


FROM node:24-slim AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# standalone/ carries server.js and its traced dependencies; static assets and
# public files are copied in beside it, as the standalone output leaves them
# out on the assumption of a CDN.
#
# Ownership matters: revalidation rewrites the prerendered pages and writes to
# .next/cache. Copied as root, those paths are read-only to the app, and the
# catalogue silently freezes at whatever the build produced - no new product
# or price would ever appear without a redeploy.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN install -d -o node -g node /app/.next/cache

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
