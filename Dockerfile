FROM node:8.3

ADD     app /app
WORKDIR /app
RUN     npm install

CMD    ["npm", "start"]
