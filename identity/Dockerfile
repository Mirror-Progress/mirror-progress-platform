FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS build
WORKDIR /app
# Intentionally refuses to build until the reviewed npm lock has been generated.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_EXTRA_CA_CERTS=/app/certs/aws-rds-global-bundle.pem
ENV NODE_ENV=production IDENTITY_MODE=synthetic IDENTITY_BIND_HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/migrations ./migrations
COPY --from=build --chown=node:node /app/certs ./certs
# ECS mounts an ephemeral volume here; image ownership initializes the mount.
RUN mkdir -p /run/identity && chown node:node /run/identity && chmod 700 /run/identity
VOLUME ["/run/identity"]
USER node
EXPOSE 3040 3041
CMD ["node", "dist/src/server.js"]
