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

const logger = require('../config/logger');
const config = require('../config/config.js');
const metricModel = function() {
    switch (config.store.type) {
    case 'none':
        var noOpModel = {
            SaveMetric() {}
        };
        return noOpModel;
    case 'mongo':
        return new require('./mongodb.js').Metric();
    case 'influx':
        return require('./influxdb.js');
    case 'file':
        var dbClass = require('./file.js').Metric;
        return new dbClass();
    }
}();

const checkFieldsExists = function(map, ...fields) {
    for (var i = 0; i < fields.length; i++) {
        if (!(fields[i] in map)) {
            return fields[i];
        }
    }

    return null;
};

const generateBenchmarkOpts = function(requestBody) {
    field = checkFieldsExists(requestBody, "loadTest", "stageId", "intensity");
    if (field !== null) {
        return [{}, "Field not found: " + field];
    }

    return [
        {
            initialize: requestBody.initialize,
            initializeType: requestBody.initializeType,
            loadTest: requestBody.loadTest,
            intensity: requestBody.intensity,
            cleanup: requestBody.cleanup,
            stageId: requestBody.stageId
        },
        null
    ];
};

const generateCalibrationOpts = function(requestBody) {
    field = checkFieldsExists(requestBody, "loadTest", "slo", "stageId");
    if (field !== null) {
        return [{}, "Field not found: " + field];
    }

    return [
        {
            initialize: requestBody.initialize,
            initializeType: requestBody.initializeType,
            loadTest: requestBody.loadTest,
            slo: requestBody.slo,
            stageId: requestBody.stageId
        },
        null
    ];

}

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
    logger.log('verbose', req.body);
    /*
     * POST route for form submit runs benchmark and displays results.
     */
    [benchmarkOpts, error] = generateBenchmarkOpts(req.body);
    if (error !== null) {
        res.status(400).json({"error": error});
        return
    }

    runBenchmark(benchmarkOpts, function(err, results) {
        // If the returned object is empty pass null to the template for the results object.
        // This will make it easier to determine whether to display an error or not.
        if (err === null) {
            res.status(200).render('results', {
                "results": results,
                "target_host": req.body.target_host,
                "target_port": req.body.target_port,
                "target_pw": req.body.target_pw,
                "num_requests": req.body.num_requests,
                "error": null
            });

            metricModel.SaveMetric(results);
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
    [request, error] = generateCalibrationOpts(req.body)
    if (error !== null) {
        res.status(400).json({"error": error});
        return
    }

    if (calibrations[request.stageId] && calibrations[request.stageId].status === "running") {
      res.status(400).json({"error": "Benchmark for stage Id " + request.stageId + " already running"});
      return
    }

    calibrations[request.stageId] = {"opts": request, "status": "running"};

    runCalibration(request, function(err, results) {
        if (err !== null) {
            logger.log('error', `Error running calibration: ${err}`);
            calibration = calibrations[request.stageId]
            calibration.status = "failed";
            calibration.error = err.message
        } else {
            logger.log('info', `Calibration finished for stage ${request.stageId}`);
            for (let result in results.runResults) {
              metricModel.SaveMetric(result);
            }
            metricModel.SaveMetric({stageId: request.stageId, finalResults: results.finalResults});
            calibration = calibrations[request.stageId]
            calibration.status = "success";
            calibration.results = {finalResults: results.finalResults, runResults: results.runResults}
        }
    });

    res.sendStatus(202);
});

app.post('/api/benchmarks', function(req, res) {
    /*
     * Provide an API endpoint for running a benchmark.
     */
    res.contentType('application/json');

    [benchmarkOpts, error] = generateBenchmarkOpts(req.body);
    if (error !== null) {
        res.status(400).json({"error": error});
        return
    }

    if (benchmarks[benchmarkOpts.stageId] && benchmarks[benchmarkOpts.stageId].status === "running") {
      res.status(400).json({"error": "Benchmark for stage Id " + benchmarkOpts.stageId + " already running"});
      return
    }

    benchmarks[benchmarkOpts.stageId] = {"opts": benchmarkOpts, "status": "running"};

    runBenchmark(benchmarkOpts, function(err, results) {
        if (err !== null) {
            logger.log('error', `Error found with benchmark: ${err}`);
            benchmark = benchmarks[benchmarkOpts.stageId];
            benchmark.status = "failed";
            benchmark.error = err.message;
        } else {
            logger.log('info', `Benchmark finished for stage ${benchmarkOpts.stageId}`);
            for (let result in results) {
              metricModel.SaveMetric(result);
            }
            benchmark = benchmarks[benchmarkOpts.stageId];
            benchmark.status = "success";
            benchmark.results = results;
        }
    });

    res.sendStatus(202);
});

var runBenchmark = function(options, callback) {
    /**
     * Run a benchmark for the server given in options.
     */

    // Assume the options sent are options appropriate for Benchmark
    try {
      const benchmark = new Benchmark(options);
      logger.log('info', `Running benchmark id [${options.stageId}]`);

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
      logger.log('info', `Running calibration id [${options.stageId}]`);

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
        logger.log('info', `benchmarks-ui running on ${host}: ${port}`);
    });
    return server;
}
