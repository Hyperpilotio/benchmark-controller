/**
 * benchmarks-ui.js - Very simple Express web application for benchmarking performance.
 *
 * Author: Adam Duston
 * License: MIT
 */
var express = require('express');
var fs = require('fs');
var Benchmark = require('../lib/benchmark');
var Calibration = require('../lib/calibration');
var bodyParser = require('body-parser');
var os = require('os');
var querystring = require("querystring");

const config = require('../config/config.js');
const metricModel = function() {
    switch (config.store.type) {
    case 'mongo':
        return new require('./mongodb.js').Metric();
    case 'influx':
        return require('./influxdb.js');
    case 'file':
        var dbClass = require('./file.js').Metric;
        return new dbClass();
    }
}();

const generateBenchmarkOpts = function(requestBody) {
    return {
        initialize: requestBody.initialize,
        loadTests: requestBody.loadTests,
        cleanup: requestBody.cleanup,
        stageId: requestBody.stageId
    };
};

var benchmarks = {}
var calibrations = {}

// Initialize the express application. Use Jade as the view engine
const app = express();
app.set('view engine', 'jade');
app.set('json spaces', 2);

// Create a static resource for the public directory.
app.use(express.static('public'));

// Use the json BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// GET route for index
app.get('/', function(req, res) {
    res.render('index');
});

app.post('/', function(req, res) {
    console.log(req.body);
    /*
     * POST route for form submit runs benchmark and displays results.
     */
    const benchmarkOpts = generateBenchmarkOpts(req.body);

    runBenchmark(benchmarkOpts, function(err, results) {
        // If the returned object is empty pass null to the template for the results object.
        // This will make it easier to determine whether to display an error or not.
        outputResults = null;

        if (err === null) {
            outputResults = results;

            res.status(200).render('results', {
                "results": outputResults,
                "target_host": req.body.target_host,
                "target_port": req.body.target_port,
                "target_pw": req.body.target_pw,
                "num_requests": req.body.num_requests,
                "error": null
            });

            for (let result in outputResults) {
              metricModel.SaveMetric(result);
            }
        } else {
            res.status(404).json({
                "results": null,
                "target_host": req.body.target_host,
                "target_port": req.body.target_port,
                "target_pw": req.body.target_pw,
                "num_requests": req.body.num_requests,
                "error": err.message
            });
        }
    });
});

app.get('/api/benchmarks/:stageId', function(req, res) {
    res.contentType('application/json');
    stageId = req.params.stageId
    if (benchmarks[stageId]) {
        res.status(200);
        res.json(benchmarks[stageId]);
    } else {
        res.status(404);
    }
});

app.get('/api/calibrate/:stageId', function(req, res) {
    res.contentType('application/json');
    stageId = req.params.stageId
    if (calibrations[stageId]) {
        res.status(200);
        res.json(calibrations[stageId]);
    } else {
        res.status(404);
    }
});

app.post('/api/calibrate', function(req, res) {
    res.contentType('application/json');
    requestBody = req.body

    request = {
        initialize: requestBody.initialize,
        loadTest: requestBody.loadTest,
        slo: requestBody.slo,
        stageId: requestBody.stageId
    };

    if (calibrations[request.stageId] && calibrations[request.stageId].status === "running") {
      res.status(400).json({"error": "Benchmark for stage Id " + benchmarkOpts.stageId + " already running"});
      return
    }

    calibrations[request.stageId] = {"opts": request, "status": "running"};

    runCalibration(request, function(err, results) {
        if (err !== null) {
            console.log("Error running calibration:");
            console.log(err);
            res.status(500).json({"error": "Error running calibration: " + err.message});
            calibration = calibrations[request.stageId]
            calibration.status = "failed";
            calibration.error = err.message
        } else {
            console.log("Calibration finished for stage "  + request.stageId);
            for (let result in results.runResults) {
              metricModel.SaveMetric(result);
            }
            metricModel.SaveMetric({stageId: request.stageId, finalIntensityArgs: results.finalIntensityArgs});
            calibration = calibrations[request.stageId]
            calibration.status = "success";
            calibration.results = {finalIntensityArgs: results.finalIntensityArgs, runResults: results.runResults}
        }
    });

    res.status(202);
});

app.post('/api/benchmarks', function(req, res) {
    /*
     * Provide an API endpoint for running a benchmark and getting back a raw JSON.
     */
    res.contentType('application/json');

    const benchmarkOpts = generateBenchmarkOpts(req.body);

    if (benchmarks[benchmarkOpts.stageId] && benchmarks[benchmarkOpts.stageId].status === "running") {
      res.status(400).json({"error": "Benchmark for stage Id " + benchmarkOpts.stageId + " already running"});
      return
    }

    benchmarks[benchmarkOpts.stageId] = {"opts": benchmarkOpts, "status": "running"};

    runBenchmark(benchmarkOpts, function(err, results) {
        if (err !== null) {
            console.log("Error found with benchmark:");
            console.log(err);
            res.status(500).json({"error": "Error running benchmark: " + err.message});
            benchmarks[benchmarkOpts.stageId].status = "failed";
        } else {
            console.log("Benchmark finished for stage " + benchmarkOpts.stageId);
            for (let result in results) {
              metricModel.SaveMetric(result);
            }
            benchmarks[benchmarkOpts.stageId].status = "success";
            res.status(200).json(results);
        }
    });
});

var runBenchmark = function(options, callback) {
    /**
     * Run a benchmark for the server given in options.
     */

    // Assume the options sent are options appropriate for Benchmark
    try {
      const benchmark = new Benchmark(options);
      console.log("Running benchmark id [%s]", options.stageId);

      // Run the benchmark and pass the output to the calling function.
      benchmark.flow(function(err, output) {
          callback(err, output);
      });
    } catch (err) {
      callback(err, null);
    }
};

var runCalibration = function(options, callback) {
    /**
     * Run calibration for the server given in options.
     */

    try {
      const calibration = new Calibration(options);
      console.log("Running calibration id [%s]", options.stageId);

      // Run the benchmark and pass the output to the calling function.
      calibration.flow(function(err, output) {
          callback(err, output);
      });
    } catch (err) {
      callback(err, null);
    }
};

// Start the application.
exports.app = function() {
    let server = app.listen(config.port, config.host, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('benchmarks-ui running on %s:%d', host, port);
    });
    return server;
}
