/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');
const types = require('./types.js');
const Parser = require('../extension-lib/parser.js');

const MAX_RUNS = 50;

function Calibration(options) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }

    this.initialize = options.initialize;
    this.loadTest = options.loadTest;
    if (this.loadTest.args === undefined) {
        this.loadTest.args = [];
    }
    this.argValues = {};
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        intensityArg = this.loadTest.intensityArgs[i];
        this.argValues[intensityArg.name] = intensityArg.startingValue;
    }
    this.slo = options.slo;
    this.results = []
    this.finalIntensityArgs = {}
}

/**
 * Compute the next intensity args to run for calibration.
 * @return Error if error found, otherwise null.
 */
Calibration.prototype.computeNextIntensityArgs = function() {
    if (this.results.length == 0) {
        return new types.Result({error: "No past run results found"});
    }

    lastRunResult = this.results[this.results.length - 1];
    lastRunMetric = parseFloat(lastRunResult.results[this.slo.metric]);

    if (lastRunMetric < this.slo.value) {
        if (this.results.length == MAX_RUNS) {
            return new types.Result({error: "Maximum runs reached"});
        }

        newIntensityArgs = {}
        for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
            intensityArg = this.loadTest.intensityArgs[i];
            newIntensityArgs[intensityArg.name] = lastRunResult.intensityArgs[intensityArg.name] + intensityArg.step;
        }

        return new types.Result({value: {nextArgs: newIntensityArgs}});
    } else {
        if (lastRunMetric == this.slo.value || this.slo.type == "throughput") {
            // For throughput slo, we want to find the run that just runs past the goal,
            // assuming we're increasing intesnity over time.
            // For latency slo, we also just return the last run that meets the slo goal.
            finalIntensityArgs = this.results[this.results.length - 1].intensityArgs;
            return new types.Result({value: {finalArgs: finalIntensityArgs}});
        }

        // Handling latency that last run went over the slo goal.

        if (this.results.length == 1) {
            return new types.Result({error: "No intensities can match sla goal"});
        }

        // The last run went over the goal, so we use the previous run's intensity args
        finalIntensityArgs = this.results[this.results.length - 2].intensityArgs;
        return new types.Result({value: {finalArgs: finalIntensityArgs}});
    }
}

function createCalibrationFunc(that, loadTest) {
    return function(done) {
        args = loadTest.args.slice();
        for (i = 0; i < loadTest.intensityArgs.length; i++) {
            intensityArg = loadTest.intensityArgs[i]
            if (intensityArg.arg !== undefined) {
                args.push(intensityArg.arg);
            }
            args.push(that.argValues[intensityArg.name]);
        }
        command = {path: loadTest.path, args: args}
        console.log("Running calibration benchmark: " + JSON.stringify(command));

        commandUtil.RunBenchmark(command, that.results, {intensityArgs: that.argValues}, function(error) {
            if (error !== null && error !== undefined) {
                done(error);
                return
            }

            result = that.computeNextIntensityArgs();
            if (result.error !== null) {
                console.log("Unexpected error when finding next intensity arg: " + result.error);
                done(result.error);
                return
            } else if (result.value.finalArgs !== undefined) {
                console.log("Final intensity args found: " + JSON.stringify(result.value.finalArgs));
                that.finalIntensityArgs = result.value.finalArgs;
                done();
                return
            }

            console.log("Setting next run's intensity args to " + JSON.stringify(result.value.nextArgs));
            that.argValues = result.value.nextArgs;
            createCalibrationFunc(that, loadTest)(done);
        });
    }
}

Calibration.prototype.flow = function(callback) {
    var that = this;
    var funcs = []
    if (that.initialize !== undefined && that.initialize !== null) {
        initialize = that.initialize;
        funcs.push(function(done) {
            commandUtil.RunCommand(initialize, done);
        });
    }

    funcs.push(createCalibrationFunc(that, that.loadTest));

    async.series(
      funcs,
      function(err) {
        callback(err, {runResults: that.results, finalIntensityArgs: that.finalIntensityArgs});
    });
};

module.exports = Calibration;
