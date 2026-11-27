FROM node:24-slim AS build

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install --workspace=@portfolio/api --include-workspace-root

COPY shared/ ./shared/
COPY apps/api/ ./apps/api/

RUN mkdir -p /app/apps/api/private
RUN npm --workspace=@portfolio/api run build
RUN npm prune --omit=dev --workspace=@portfolio/api --include-workspace-root

FROM node:24-slim AS runtime

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/assets ./apps/api/assets
COPY --from=build /app/apps/api/private ./apps/api/private

WORKDIR /app/apps/api

EXPOSE 3333

CMD ["npm", "start"]
