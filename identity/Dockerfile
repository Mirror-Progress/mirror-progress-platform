FROM node:22-bookworm-slim AS build
WORKDIR /app
# Intentionally refuses to build until the reviewed npm lock has been generated.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
FROM node:22-bookworm-slim
ENV NODE_ENV=production IDENTITY_MODE=synthetic IDENTITY_BIND_HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3040
CMD ["node", "dist/src/server.js"]
