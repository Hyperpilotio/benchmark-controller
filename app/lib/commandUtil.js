const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');

var exports = module.exports = {};

exports.SetDefault = function(value, defaultValue) {
    return (value === undefined || value === null) ? defaultValue : value;
}

exports.RunCommand = function(commandObj, callback) {
    // Add the number of requests set to the arguments.
    const args = commandObj.args;
    const path = commandObj.path;

    // Spawn the child process to run the benchmark.
    const child = spawn(path, args);

    // Collect stdout into a CSV string.
    let output = {};
    output['stdout'] = "";
    output['stderr'] = "";
    child.stdout.on('data', function(data) {
        output['stdout'] += data;
        console.log("child_process [%s] [STDOUT]:%s", commandObj.path, data);
    });

    child.stderr.on('data', function(data) {
        // Log errors
        output['stderr'] += data;
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
        const stdout = output['stdout'].split("\n");
        const stderr = output['stderr'].split("\n");
        console.log(stderr);
        var benchmarkObj, stderrObj;

        // Compatible to old parser...
        if (typeof parser.processStdout === "function") {
            benchmarkObj = parser.processStdout(stdout);
            stderrObj = parser.processStderr(stderr);
            console.log(stderr);
        } else {
            // old method
            benchmarkObj = parser.processLines(stdout);
            console.log("In order support new calibration feeature, please implement processStdout and processStderr in your parser.");
        }
        
        // Return the resulting benchmarks data object.
        var result = {};
        for (var i in tags) {
            result[i] = tags[i];
        }
        
        result["results"] = benchmarkObj;
        result["stderrs"] = stderrObj ? stderrObj : {};

        results.push(result);
        callback();
    });
};
