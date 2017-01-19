FROM    node:latest
ADD     app /app
WORKDIR /app
RUN     npm install
CMD     node bin/benchmarks-ui.js
