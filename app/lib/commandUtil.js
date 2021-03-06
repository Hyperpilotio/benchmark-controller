const spawn = require('child_process').spawn;
const logger = require('../config/logger');
const parserUtil = require('./parserUtil');

const dockerPath = 'docker';
// --rm: we don't end up a lot of containers on the host not cleaned up
const dockerArgs = ['run', '--rm', '--net', 'host'];

var exports = module.exports = {};

exports.SetDefault = function(value, defaultValue) {
    return (value === undefined || value === null) ? defaultValue : value;
};

/**
 * CheckCommandObject
 * function that checks whether or not the input is a valid command object.
 * @param  object commandObj
 * @return string missing field
 */
var FindMissingCommandFields = function(commandObj) {
    if (!commandObj) {
        return "commandObj";
    } else if (!commandObj.image) {
        return "image";
    } else if (!commandObj.args) {
        return "args";
    } else if (!commandObj.path) {
        return "path";
    }

    return "";
}

/**
 * RunCommand
 * function to execute the given command.
 * @param {object} commandObj
 * @param {boolean} collectOutput
 * @param {function} callback
 */
exports.RunCommand = function(commandObj, collectOutput, callback) {
    let missingField = FindMissingCommandFields(commandObj);
    if (missingField != "") {
        logger.log('error', `Error running command: ${JSON.stringify(commandObj)}`);
        callback(new Error(`Variable commandObj is missing field ${missingField}`), null);
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

exports.RunBenchmark = function(commandObj, parser, results, tags, callback) {
    exports.RunCommand(commandObj, true, function(error, output) {
        if (error !== null) {
            callback(error);
            return;
        }
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
        const result = {};
        for (let i in tags) {
            result[i] = tags[i];
        }
        result["results"] = benchmarkObj;
        results.push(result);
        callback();
    });
};
