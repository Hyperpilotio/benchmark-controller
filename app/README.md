# A Generic Web GUI for benchmark

This is a simple web app frontend for running the benchmark tool.



![Alt text](https://raw.githubusercontent.com/compybara/redis-benchmarks-ui/master/screenshots/benchmarks-ui.png)

## Installation

To run this application you will need to install [node](https://nodejs.org/en/download/).
To install from Github

    $ git clone https://github.com/hyperpilotio/benchmark-controller.git
    $ npm install

## Usage

To run locally complete the above configuration and run

    node bin/benchmarks-ui.js

You can deploy this app to CoudFoundry using the included `manifest.yml` and `Procfile`. You will need to follow the
setup instructions for compling a standalone binary in order to run the app in CloudFoundry as it's not likely that the
CF environment will have a copy of the redis-cli tools installed.

Note that the compiled binary must be compatible with the CloudFoundry environment. Most likely you will need to build
it for the Linux x86_64 architecture. In my testing I was not able to run the app in CloudFoundry using a binary built
in OS X.


### API

As well as providing a web-based GUI for running benchmark tool. This app also provides a couple of useful RESTful
endpoints.

#### `POST /api/benchmark`

Executes a benchmark and returns the results in JSON format.
You will need to supply the details of the instance to benchmark in the body of the request. The `host` option is
required, and the rest of the values will use default values if no value is given.

Here's an example:

    $ curl -H "Content-Type: application/json" -X POST -d '{"host": "10.0.0.184", "port": 6004, "password": "redispassword", requests": 10000}' https://localhost:6001/api/redis-benchmark
    {
      "PING_INLINE": "37313.43",
      "PING_BULK": "37313.43",
      "SET": "37037.04",
      "GET": "37174.72",
      "INCR": "37174.72",
      "LPUSH": "37453.18",
      "RPUSH": "37453.18",
      "LPOP": "37453.18",
      "RPOP": "37313.43",
      "SADD": "37313.43",
      "SPOP": "37037.04",
      "LPUSH (needed to benchmark LRANGE)": "37174.72",
      "LRANGE_100 (first 100 elements)": "37313.43",
      "LRANGE_300 (first 300 elements)": "37593.98",
      "LRANGE_500 (first 450 elements)": "37174.72",
      "LRANGE_600 (first 600 elements)": "37313.43",
      "MSET (10 keys)": "40650.41"
    }

#### `GET /api/instances`

API endpoint to discover the details of databse / app instances bound to the application. This only works when the application
is running inside CloudFoundry. It will parse the services from `VCAP_SERVICES` and return their details in JSON
format.

If the app is not running in CloudFoundry it will return an empty JSON object.

Example:

    $ curl -H "Content-Type application/json"  https://localhost:6001/api/redis-instances
    {
	    "name": "redis-test",
	    "workflow": ["run"],
	    "commandSet": {
		    "run": {
		    	"name": "load-testing",
		    	"binPath": "/usr/bin/redis-benchmark",
		    	"args": ["-h", "redis-serve", "-p", "6379", "--csv", "-n", "100"],
		    	"type": "run"
		    }
	    }
    }
