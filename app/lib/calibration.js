/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');
const types = require('./types.js');
const Parser = require('../extension-lib/parser.js');

const MAX_STAGES = 50;

function Calibration(options) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }

    this.initialize = options.initialize;
    this.loadTest = options.loadTest;
    this.loadTest.args = commandUtil.SetDefault(this.loadTest.args, []);
    this.argValues = {};
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        intensityArg = this.loadTest.intensityArgs[i];
        this.argValues[intensityArg.name] = intensityArg.startingValue;
    }
    this.runsPerIntensity = commandUtil.SetDefault(options.runsPerIntensity, 3);
    this.slo = options.slo;
    // Results stores all the past runs for all intensities
    this.results = []
        // Stage results stores multiple run results for the current intensity args
    this.stageResults = []
        // Summaries stores all the summarized results from the stage results
    this.summaries = []
        // Final intensity args stores the final calibrated intensity output
    this.finalIntensityArgs = {}
    this.lastMaxSummary = {
        qos: 0.0
    };
}

Calibration.prototype.computeNextLatencyArgs = function() {
    if (this.summaries.length == 0) {
        return new types.Result({
            error: "No past run results found"
        });
    }

    lastRunResult = this.summaries[this.summaries.length - 1];
    lastRunMetric = lastRunResult.qos;

    if (lastRunMetric < this.slo.value) {
        if (this.summaries.length == MAX_STAGES) {
            return new types.Result({
                error: "Maximum runs reached"
            });
        }

        newIntensityArgs = {}
        for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
            intensityArg = this.loadTest.intensityArgs[i];
            newIntensityArgs[intensityArg.name] = lastRunResult.intensityArgs[intensityArg.name] + intensityArg.step;
        }

        return new types.Result({
            value: {
                nextArgs: newIntensityArgs
            }
        });
    } else {
        if (lastRunMetric == this.slo.value) {
            // For throughput slo, we want to find the run that just runs past the goal,
            // assuming we're increasing intesnity over time.
            // For latency slo, we also just return the last run that meets the slo goal.
            finalIntensityArgs = this.summaries[this.summaries.length - 1].intensityArgs;
            return new types.Result({
                value: {
                    finalArgs: finalIntensityArgs
                }
            });
        }

        if (this.summaries.length == 1) {
            return new types.Result({
                error: "No intensities can match sla goal"
            });
        }

        // The last run went over the goal, so we use the previous run's intensity args
        finalIntensityArgs = this.summaries[this.summaries.length - 2].intensityArgs;
        return new types.Result({
            value: {
                finalArgs: finalIntensityArgs
            }
        });
    }
};

Calibration.prototype.computeNextThroughputArgs = function() {
    if (this.summaries.length == 0) {
        return new types.Result({
            error: "No past run results found"
        });
    }

    lastRunResult = this.summaries[this.summaries.length - 1];
    lastRunMetric = lastRunResult.qos;

    if (lastRunMetric > this.lastMaxSummary.qos) {
        this.lastMaxSummary = lastRunResult;
        this.lastMaxRuns = 0;
    }

    // TODO: Make max runs configurable
    if (this.lastMaxRuns >= 5 || this.summaries.length == MAX_STAGES) {
        if (this.slo.value > this.lastMaxSummary.qos) {
            return new types.Result({
                error: "Cannot find configuration that meets SLO"
            });
        }

        return new types.Result({
            value: {
                finalArgs: this.lastMaxSummary.intensityArgs
            }
        });
    }

    this.lastMaxRuns += 1;

    newIntensityArgs = {}
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        intensityArg = this.loadTest.intensityArgs[i];
        newIntensityArgs[intensityArg.name] = lastRunResult.intensityArgs[intensityArg.name] + intensityArg.step;
    }

    return new types.Result({
        value: {
            nextArgs: newIntensityArgs
        }
    });
}


/**
 * Compute the next intensity args to run for calibration.
 * @return Error if error found, otherwise null.
 */
Calibration.prototype.computeNextIntensityArgs = function() {
    if (this.slo.type == "throughput") {
        return this.computeNextThroughputArgs();
    } else {
        return this.computeNextLatencyArgs();
    }
}

function createCalibrationFunc(that) {
    return function(done) {
        args = that.loadTest.args.slice();
        for (i = 0; i < that.loadTest.intensityArgs.length; i++) {
            intensityArg = that.loadTest.intensityArgs[i]
            if (intensityArg.arg !== undefined) {
                args.push(intensityArg.arg);
            }
            args.push(that.argValues[intensityArg.name]);
        }
        command = {
            path: that.loadTest.path,
            args: args
        }

        console.log("Running calibration benchmark: " + JSON.stringify(command));

        commandUtil.RunBenchmark(command, that.stageResults, {
            intensityArgs: that.argValues
        }, function(error) {
            if (error !== null && error !== undefined) {
                done(error);
                return
            }

            if (that.stageResults.length < that.runsPerIntensity) {
                console.log("Running #" + (that.stageResults.length + 1) + " calibration run for the same intensity");
                createCalibrationFlowFunc(that)(done);
                return
            }

            lastRunMetrics = 0.0;
            // Move stage run history into results
            for (i = 0; i < that.stageResults.length; i++) {
                lastResults = that.stageResults[i];
                lastRunMetrics += parseFloat(lastResults.results[that.slo.metric]);
                that.results.push(lastResults);
            }

            that.summaries.push({
                qos: lastRunMetrics / (that.stageResults.length * 1.0),
                intensityArgs: that.argValues
            })

            that.stageResults = [];

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
            createCalibrationFlowFunc(that)(done);
        });
    }
}

function createCalibrationFlowFunc(that) {
    return function(done) {
        if (that.initialize !== undefined && that.initialize !== null) {
            console.log("Initializing calibration: " + JSON.stringify({path: that.initialize.path, args: that.initialize.args}))
            commandUtil.RunCommand(that.initialize, function(error, output) {
                if (error !== null) {
                    done(error);
                    return
                }

                createCalibrationFunc(that)(done)
            })
        } else {
                createCalibrationFunc(that)(done)
        }
    }
}

Calibration.prototype.flow = function(callback) {
    var that = this;

    async.series(
        [createCalibrationFlowFunc(that)],
        function(err) {
            callback(err, {
                runResults: that.results,
                finalIntensityArgs: that.finalIntensityArgs
            });
        });
};

module.exports = Calibration;
