const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');

var exports = module.exports = {};

exports.RunCommand = function(commandObj, callback) {
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
        callback(new Error(error), null);
    });

    child.on('exit', function(exitCode) {
        console.log("Child process exited with code: " + exitCode);
        if (exitCode !== 0) {
            callback(new Error(error_output), null);
        } else {
            callback(null, output);
        }
    });
}

exports.RunBenchmark = function(commandObj, results, tags, callback) {
    exports.RunCommand(commandObj, function(error, output) {
        if (error !== null) {
            callback(error);
            return;
        }

        // Parse the output of benchmark to an object.
        const parser = new Parser(commandObj);
        const lines = output.split("\n");
        const benchmarkObj = parser.processLines(lines);
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
