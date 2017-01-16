# Usage

## Requirements:

* config.json (required, parameters for benchmark-controller)
* benchmark-processing.js (required, implement the benchmarkRun function and export it)
* pre-run.sh (optional, preparation for load test)

Developer needs to implement / adjust each file according to the target db / application (mysql, redis, cassandra...)

## Workflow

run.sh --> pre-run.sh (installation / generate data) --> run.sh (check nodejs application's dependencies, start application)

run.sh
```{shell}
# check the existence of pre-run.sh

/PATH/pre-run.sh

# Start the application
node bin/benchmark-controller.js
```

pre-run.sh

```{shell}
# Install the dependencies

npm install redis-cli --save

# generate testing data (like mysql case)

GENERATE_DATA_TOOL
```

## Structure

Example:

```
workloads/redis/benchmark/

- Dockerfile (refer to above example)
- customized-lib/ (Put config.json, benchmark-processing.js, and pre-run.sh in this folder)
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

CMD "run.sh"
```

* `run.sh` will install all the required dependencies
according to files in the customized-lib folder and start the nodejs application.


