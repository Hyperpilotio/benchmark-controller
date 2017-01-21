/**
 * benchmarks.js - Utility module for running benchmarks cli too.
 *
 * Author: Adam Duston
 * License: MIT
 */
const util = require('util');
const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');

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
        if (commandObj.type === "beforeRun") {
            this.beforeRun(commandObj);
        } else if (commandObj.type === "run") {
            // command, start the load testing.
            this.run(commandObj, function(err, res) {
                callback(err, res);
            });
        } else if (commandObj.type === "afterRun") {
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
        if (exitCode !== 0) {
            console.log("Child process exited with code: " + exitCode);
            callback(new Error(error_output), null);
        } else { // Parse the output of benchmark to an object.
            const parser = new Parser();
            const lines = output.split("\n");
            const benchmarkObj = parser.processLines(lines);;
            // Return the resulting benchmarks data object.
            callback(null, benchmarkObj);
        }
    });
};

module.exports = Benchmark;
