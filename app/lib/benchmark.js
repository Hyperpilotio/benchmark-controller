/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');

function BenchmarkException(message) {
    this.name = "BenchmarkException";
    this.message = message;
}

function Benchmark(options) {
    if (options.loadTest === undefined) {
      throw new BenchmarkException("Initialization Failed");
    }
}

Benchmark.prototype.flow = function(callback) {
  if (this.cleanup !== undefined) {
    callback = function(error, data) {
      this.run(this.cleanup, null);
      callback(error, data);
    }
  }

  if (this.initialize !== undefined) {
    this.run(this.initialize, function(error, data) {
      if (error !== null) {
        callback(new Error("Failed to initialize load test with command '" + command + "': " + error.message));
      } else {
        this.run(this.loadTest, callback);
      }
    })
  } else {
    this.run(this.loadTest, callback);
  }
};

Benchmark.prototype.run = function(commandObj, callback) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const path = commandObj.path;
    const isCallbackUndefined = callback === undefined ? true : false;

    // Spawn the child process to run the  benchmark.
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
    });

    // When benchmark exits convert the csv output to json objects and return to the caller.
    child.on('exit', function(exitCode) {
        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            if (!isCallbackUndefined) {
                callback(new Error(error_output), null);
            }
        } else {
            if (!isCallbackUndefined) {
                // Parse the output of benchmark to an object.
                const parser = new Parser(commandObj);
                const lines = output.split("\n");
                const benchmarkObj = parser.processLines(lines);;
                // Return the resulting benchmarks data object.
                callback(null, benchmarkObj);
            }
        }
    });
};

module.exports = Benchmark;
