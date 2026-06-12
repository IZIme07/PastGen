# PastGen — производственный образ: API + статика клиента в одном контейнере.
# Сборка: docker compose up --build   (или docker build -t pastgen .)

# ---- этап сборки ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY shared shared
COPY server server
COPY client client
RUN npm -w client run build && npm -w server run build

# ---- зависимости рантайма (только prod) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev -w server -w shared && mkdir -p server/node_modules

# ---- рантайм ----
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/server/node_modules server/node_modules
COPY shared shared
COPY server/package.json server/
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist server/public
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:8080/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
WORKDIR /app/server
CMD ["node", "dist/index.js"]
