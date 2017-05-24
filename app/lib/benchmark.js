/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');

function Benchmark(options) {
    if (options.loadTests === undefined || options.loadTests === null) {
      throw new Error("Load test not found in benchmark");
    }
    this.initialize = options.initialize;
    this.loadTests = options.loadTests;
    this.cleanup = options.cleanup;
    this.results = []
}

Benchmark.prototype.flow = function(callback) {
    var that = this;
    var funcs = []
    if (that.initialize !== undefined && that.initialize !== null) {
      initialize = that.initialize;
      funcs.push(function(done) {
        that.run(initialize, that, done);
      });
    }
    for (var i = 0, len = this.loadTests.length; i < len; i++) {
      loadTest = that.loadTests[i];
      funcs.push(function(done) {
        that.run(loadTest.command, true, done);
      });
    }
    if (that.cleanup !== undefined && that.cleanup !== null) {
      cleanup = that.cleanup;
      funcs.push(function(done) {
        that.run(cleanup, false, done);
      });
    }

    async.series(
      funcs,
      function(err) {
        callback(err, that.results);
    });
};

Benchmark.prototype.run = function(commandObj, parseResults, callback) {
    var that = this;
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const path = commandObj.path;

    // Spawn the child process to run the benchmark.
    const child = spawn(path, args);

    // Collect stdout into a CSV string.
    let output = "";
    let error_output = "";
    child.stdout.on('data', function(data) {
        output += data;
        console.log("child_process [%s] [STDOUT]:%s", commandObj.path, data);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        error_output += data;
        console.log("child_process [%s] [STDERR]: %s", commandObj.path, data);
    });

    child.on('error', function(error) {
        console.log("Error running child process [%s]: %s", commandObj.path, error);
        callback(new Error(error));
    });

    // When benchmark exits convert the csv output to json objects and return to the caller.
    child.on('exit', function(exitCode) {
        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            callback(new Error(error_output));
        } else if (parseResults) {
            // Parse the output of benchmark to an object.
            const parser = new Parser(commandObj);
            const lines = output.split("\n");
            const benchmarkObj = parser.processLines(lines);;
            // Return the resulting benchmarks data object.
            that.results.push(benchmarkObj);
            callback();
        } else {
            callback();
        }
    });
};

module.exports = Benchmark;
