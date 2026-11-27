FROM node:24-slim AS build

WORKDIR /apps/web

COPY package*.json ./
RUN npm install

COPY . .

ARG API_BASE_URL=""
ENV API_BASE_URL=${API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

ENV PORT=4200
ENV NGINX_ENVSUBST_FILTER=^PORT$

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/40-generate-env-js.sh /docker-entrypoint.d/40-generate-env-js.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env-js.sh

COPY --from=build /apps/web/dist/portfolio/browser /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
