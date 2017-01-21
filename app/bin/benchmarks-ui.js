/**
 * benchmarks-ui.js - Very simple Express web application for benchmarking performance.
 *
 * Author: Adam Duston
 * License: MIT
 */
var express = require('express');
var fs = require('fs');
var Benchmark = require('../lib/benchmark');
var bodyParser = require('body-parser');
var os = require('os');
var uuid = require('node-uuid');
var querystring = require("querystring");

const influx = require('./influxdb.js');
// const config = require('../config/config.js');

const generateBenchmarkOpts = function(requestBody) {
    return {
        commandSet: requestBody.commandSet,
        name: requestBody.name,
        workflow: requestBody.workflow
    };
};

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
    /*
     * POST route for form submit runs benchmark and displays results.
     */
    const benchmarkOpts = generateBenchmarkOpts(req.body);

    runBenchmark(benchmarkOpts, function(err, results) {
        // If the reuturned object is empty pass null to the template for the results object.
        // This will make it easier to determine whether to display an error or not.
        outputResults = null;

        if (err === null) {
            outputResults = results;

            res.render('results', {
                "results": outputResults,
                "target_host": req.body.target_host,
                "target_port": req.body.target_port,
                "target_pw": req.body.target_pw,
                "num_requests": req.body.num_requests,
                "error": null
            });

            influx.insertInflux(outputResults);

        } else {
            res.render('results', {
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

app.post('/api/benchmark', function(req, res) {
    /*
     * Provide an API endpoint for running a benchmark and getting back a raw JSON.
     */
    res.contentType('application/json');

    // FIXME change html layout
    const benchmarkOpts = generateBenchmarkOpts(req.body);

    runBenchmark(benchmarkOpts, function(err, results) {
        if (err !== null) {
            res.status(500);
            res.status("Error running benchmark: " + err);
        } else {
            res.status(200);
            res.json(results);
        }
    });
});

app.get('/api/instances', function(req, res) {
    /*
     * Provide an API endpoint to get information about the services bound to this application. Return as a JSON
     * which includes the instance name and credentials.
     */
    res.contentType('application/json');

    // Just return an empty result if the app isn't running in CloudFoundry.
    return res.json({});
});

// Start the application. Get bind details from cfenv
var server = app.listen(6001, "0.0.0.0", function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('benchmarks-ui running on %s:%d', host, port);
});

var runBenchmark = function(options, callback) {
    /**
     * Run a benchmark for the server given in options.
     */

    // Assume the options sent are options appropriate for Benchmark
    const benchmark = new Benchmark(options);

    console.log("Running benchmark [%s]", options.name);

    // Run the benchmark and pass the output to the calling function.
    benchmark.flow(function(err, output) {
        callback(err, output);
    });
};
