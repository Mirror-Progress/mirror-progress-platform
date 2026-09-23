FROM node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe AS build
WORKDIR /app
# Intentionally refuses to build until the reviewed npm lock has been generated.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm test && npm prune --omit=dev
FROM node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
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
