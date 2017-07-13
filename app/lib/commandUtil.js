const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');
const logger = require('../config/logger');

var exports = module.exports = {};

exports.SetDefault = function(value, defaultValue) {
    return (value === undefined || value === null) ? defaultValue : value;
};

exports.RunCommand = function(commandObj, collectOutput, callback) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const path = commandObj.path;

    // Spawn the child process to run the benchmark.
    const child = spawn(path, args);

    // Collect stdout into a CSV string.
    let output = "";
    let error_output = "";
    child.stdout.on('data', function(data) {
        if (collectOutput) {
            output += data;
        }
        logger.log('verbose', `child_process [${commandObj.path}] [STDOUT]:${data}`);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        error_output += data;
        logger.log('verbose', `child_process [${commandObj.path}] [STDERR]: ${data}`);
    });

    child.on('error', function(error) {
        logger.log('error', `Error running child process [${commandObj.path}]: ${error}`);
        callback(new Error(error), null);
    });

    child.on('exit', function(exitCode) {
        logger.log('info', `Child process exited with code: ${exitCode}`);
        if (exitCode !== 0) {
            callback(new Error(error_output), null);
        } else {
            callback(null, output);
        }
    });
};

exports.RunBenchmark = function(commandObj, results, tags, callback) {
    exports.RunCommand(commandObj, true, function(error, output) {
        if (error !== null) {
            callback(error);
            return;
        }

        // Parse the output of benchmark to an object.
        const parser = new Parser(commandObj);
        const lines = output.split("\n");
        let benchmarkObj = {}
        try {
            benchmarkObj = parser.processLines(lines);
        } catch(err) {
            logger.log('warning', `Parser failed with exception: ${err}, output: ${lines}`);
            callback(err);
            return;
        }

        // Return the resulting benchmarks data object.
        var result = {};
        for (var i in tags) {
            result[i] = tags[i];
        }
        result["results"] = benchmarkObj;
        results.push(result);
        callback();
    });
};
