FROM    node:alpine
ADD     app /app
WORKDIR /app
RUN     npm install

