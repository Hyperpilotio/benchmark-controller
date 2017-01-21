FROM    node:latest
ADD     app /app
WORKDIR /app
RUN     npm install

# Adjust it according to your usage.
#RUN apt-get update && apt-get install -y redis-server
#CMD     node bin/benchmarks-ui.js

