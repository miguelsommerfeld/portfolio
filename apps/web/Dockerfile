FROM node:24

WORKDIR /apps/web
COPY ./package*.json ./

RUN npm install

COPY . .
RUN npx ng build

EXPOSE 4200

CMD [ "npx", "serve", "-s", "dist/portfolio/browser", "-l", "4200" ]
