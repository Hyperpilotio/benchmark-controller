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
    this.argValues = {};
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        intensityArg = this.loadTest.intensityArgs[i];
        this.argValues[intensityArg.name] = intensityArg.startingValue;
    }
    this.slo = options.slo;
    this.results = []
    this.step = 5;
    this.finalIntensityArgs = {}
}

/**
 * Compute the next intensity args to run for calibration.
 * @return Error if error found, otherwise null.
 */
Calibration.prototype.computeNextIntensityArgs = function() {
    if (results.length == 0) {
        return new types.Result({error: "No past run results found"});
    }

    lastRunResult = this.results[this.results.length - 1];
    lastRunMetric = lastRunResult.results[this.slo.metric];

    if (lastRunMetric < this.slo.value) {
        if (results.length == MAX_RUNS) {
            return new types.Result({error: "Maximum runs reached"});
        }

        newIntensityArgs = {}
        for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
            intensityArg = this.loadTest.intensityArgs[i];
            newIntensityArgs[intensityArg.name] = lastRunResult.intensityArgs[intensityArg.name] + intensityArg.step;
        }

        return new types.Result({value: {nextArgs: newIntensityArgs}});
    } else if (lastRunMetric > this.slo.value) {
        if (this.results.length == 1) {
            return new types.Result({error: "No intensities can match sla goal"});
        }

        // The last run went over the goal, so we use the previous run's intensity args
        finalIntensityArgs = this.results[this.results.length - 2].intensityArgs;
        return new types.Result({value: {finalArgs: finalIntensityArgs}});
    }

    return new types.Result({value: {finalArgs: lastRunResult.intensityArgs}});
}

function createCalibrationFunc(that, loadTest) {
    return function(done) {
        args = loadTest.args.slice();
        for (i = 0; i < loadTest.intensityArgs.length; i++) {
            intensityArg = loadTest.intensityArgs[i]
            args.push(intensityArg.arg);
            args.push(that.argValues[intensityArg.name]);
        }

        commandUtils.RunBenchmark({"path": loadTest.path, "args": args}, that.results, {intensityArgs: that.argValues}, new function(error) {
            if (error !== null) {
                done(error);
                return
            }

            result = that.computeNextIntensityArgs();
            if (result.error !== null) {
                done(result.error);
            } else if (result.value.finalArgs !== undefined) {
                that.finalIntensityArgs = result.value.finalArgs;
                done();
            }

            console.log("Setting Next run's intensity args to " + result.value.nextArgs);
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
            commandUtils.RunCommand(initialize, done);
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
