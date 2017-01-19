/**
 * benchmarks.js - Utility module for running benchmarks cli too.
 *
 * Author: Adam Duston
 * License: MIT
 */
var util = require('util');
var spawn = require('child_process').spawn;

function BenchmarkException(message) {
    this.name = "BenchmarkException";
    this.message = message;
}

function Benchmark(options) {
    if (options.workflow === undefined) {
        throw new BenchmarkException("Initialization Failed");
    }
    const workflow = options.workflow.length > 0 ? options.workflow : [];

    this.getBenchmarkWorkflow = function() {
        return workflow;
    };

    this.getCommandSet = function() {
        return Object.assign({}, options.commandSet);
    };
}

Benchmark.prototype.flow = function(callback) {
    const workflow = this.getBenchmarkWorkflow();
    const lenghtOfWorkflow = workflow.length;
    const commandSet = this.getCommandSet();

    if (lenghtOfWorkflow == 0) {
        return;
    }

    for (i = 0; i < lenghtOfWorkflow; i++) {
        const commandObj = commandSet[workflow[i]];
        if (commandObj.type == "beforeRun") {
            this.beforeRun(commandObj);
        } else if (commandObj.type == "run") {
            // command, start the load testing.
            this.run(commandObj, callback);
        } else if (commandObj.type == "afterRun") {
            // FIXME does this command work ??
            this.afterRun(commandObj);
        }
    }
};

Benchmark.prototype.beforeRun = function(commandObj) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const benchmarkCommand = commandObj.binPath;

    // Spawn the child process to run the  benchmark.
    const child = spawn(benchmarkCommand, args);
    // Collect stdout into a CSV string.
    let output = "";
    let error_output = "";
    child.stdout.on('data', function(data) {
        output += data;
        console.log("child_process [%s] [STDOUT]:%s", commandObj.name, data);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        error_output += data;
        console.log("child_process [%s] [STDERR]: %s", commandObj.name, data);
    });

    child.on('error', function(error) {
        console.log("Error running child process %s: %s", commandObj.name, error);
    });

    // When benchmark exits convert the csv output to json objects and return to the caller.
    child.on('exit', function(exitCode) {
        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            // new Error(error_output);
        }
    });
};

Benchmark.prototype.afterRun = function(commandObj) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const benchmarkCommand = commandObj.binPath;

    // Spawn the child process to run the  benchmark.
    const child = spawn(benchmarkCommand, args);
    // Collect stdout into a CSV string.
    let output = "";
    let error_output = "";
    child.stdout.on('data', function(data) {
        output += data;
        console.log("child_process [%s] [STDOUT]:%s", commandObj.name, data);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        error_output += data;
        console.log("child_process [%s] [STDERR]: %s", commandObj.name, data);
    });

    child.on('error', function(error) {
        console.log("Error running child process %s: %s", commandObj.name, error);
    });

    // When benchmark exits convert the csv output to json objects and return to the caller.
    child.on('exit', function(exitCode) {
        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            // new Error(error_output);
        }
    });
};

Benchmark.prototype.run = function(commandObj, callback) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const benchmarkCommand = commandObj.binPath;

    // Spawn the child process to run the  benchmark.
    const child = spawn(benchmarkCommand, args);
    // Collect stdout into a CSV string.
    let output = "";
    let error_output = "";
    child.stdout.on('data', function(data) {
        output += data;
        console.log("child_process [%s] [STDOUT]:%s", commandObj.name, data);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        error_output += data;
        console.log("child_process [%s] [STDERR]: %s", commandObj.name, data);
    });

    child.on('error', function(error) {
        console.log("Error running child process [%s]: %s", commandObj.name, error);
    });

    // When benchmark exits convert the csv output to json objects and return to the caller.
    child.on('exit', function(exitCode) {
        benchmarkObj = {};

        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            callback(new Error(error_output), null);
        } else { // Parse the output of benchmark to an object.
            lines = output.split("\n");

            //FIXME Adjust for cassandra and something else
            for (var i in lines) {
                // There might be an empty line at the end somewhere.
                if (lines[i] === '' || lines[i] === '\n') {
                    continue;
                }
                // Clean up quotes from each line
                noquotes = lines[i].replace(/["]+/g, '');

                // Set the first column to a key and the second column to the value in an object.
                columns = noquotes.split(",");
                benchmarkObj[columns[0]] = columns[1];
            }

            // Return the resulting benchmarks data object.
            callback(null, benchmarkObj);
        }
    });
};

module.exports = Benchmark;
