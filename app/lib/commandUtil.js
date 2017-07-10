const spawn = require('child_process').spawn;
const Parser = require('../extension-lib/parser.js');
const logger = require('../config/logger');
const dockerPath = 'docker';
// --rm: we don't end up a lot of containers on the host not cleaned up
// --privileged be able to access the host. Permission is required by dind (docker in docker)
const  dockerArgs = ['run', '--rm', '--privileged'];

var exports = module.exports = {};

exports.SetDefault = function(value, defaultValue) {
    return (value === undefined || value === null) ? defaultValue : value;
};

/**
 * CheckCommandObject
 * function that checks whether or not the input is a valid command object.
 * @return boolean
 */
var IsCommandObjectValid = function(commandObj) {
    res = true;
    if(!commandObj) {
        res = false;
    } else if (!commandObj.image) {
        res = false;
    } else if (!commandObj.args) {
        res = false;
    } else if (!commandObj.path) {
        res = false;
    }
    return res;
}

/**
 * RunCommand
 * function to execute the given command.
 * @param {object} commandObj
 * @param {object} collectOutput
 * @param {function} callback
 */
exports.RunCommand = function(commandObj, collectOutput, callback) {
    if (!IsCommandObjectValid(commandObj)) {
        logger.log('error', `Error running command: ${JSON.stringify(commandObj)}`);
        callback(new Error(`Variable commandObj is not valid, ${stringify(commandObj)}`), null);
        return;
    }

    // Add the number of requests set to the arguments.
    const args = dockerArgs.concat([commandObj.image, commandObj.path]).concat(commandObj.args);

    // Spawn the child process to run the benchmark.
    const child = spawn(dockerPath, args);

    // Collect stdout into a CSV string.
    let output = '';
    let error_output = '';
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
