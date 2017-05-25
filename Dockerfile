FROM    node:latest
ENV     NODE_ENV=production
ADD     app /app
WORKDIR /app
RUN     npm install
