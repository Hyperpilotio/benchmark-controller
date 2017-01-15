# Usage

## Requirements:

* config.json (required, parameters for benchmark-controller)
* benchmark-processing.js (required, implement the benchmarkRun function and export it)
* packages.json (optional, for extra nodejs packages' installation)
* pre-run.sh (optional, preparation for load test)

## Workflow

pre-run.sh (installation / generate data) --> run.sh (check nodejs application's dependencies, start application)

## Structure

Example:

```
workloads/redis/benchmark/

- Dockerfile (refer to above example)
- customized-lib/
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


