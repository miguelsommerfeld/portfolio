FROM node:24

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY shared/ ./shared/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

RUN npm run build

EXPOSE 3333
