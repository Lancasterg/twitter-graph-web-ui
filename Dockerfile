FROM node:11

WORKDIR /app

COPY package*.json ./
COPY backend/ .

RUN npm install

EXPOSE 4000
CMD [ "node", "server.js" ]
