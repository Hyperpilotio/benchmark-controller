# Usage

## Requirements:

* config.json (required, parameters for benchmark-controller)
* parser.js (required, implement the Parser class)

Developer needs to implement / adjust each file according to the target db / application (mysql, redis, cassandra...)

## Structure

Example:

```
workloads/redis/benchmark/

- Dockerfile (refer to above example)
- customized-lib/ (Put config.json and parser.js in this folder)
```

## Docker

### Writing a Dockerfile

```
FROM wen777/benchmark-controller:base
# OS: Debian jessie / NodeJS latest version

#
#Install dependencies for load test tool
#

ADD customized-lib benchmark-controller/customized-lib

CMD node bin/benchmarks-ui.js
```
