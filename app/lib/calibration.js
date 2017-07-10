/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');
const types = require('./types.js');
const logger = require('../config/logger');

const MAX_STAGES = 50;

function Calibration(options) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }

    this.initialize = options.initialize;
    this.initializeType = commandUtil.SetDefault(options.initializeType, "run");
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
    this.finalResults = {}
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

    logger.log('info', `Last run latency metric ${lastRunMetric}, slo value: ${this.slo.value}`);

    if (lastRunMetric < this.slo.value) {
        if (this.summaries.length == MAX_STAGES) {
            return new types.Result({
                error: "Maximum runs reached"
            });
        }

        newIntensityArgs = {};
        for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
            intensityArg = this.loadTest.intensityArgs[i];
            // NOTE There is a chance that variable intesnityArgs is string and
            // intensityArg.step is string too. We want the sum of two number instead of
            // two strings. As a result, we use `Number` to ensure the arguments are numbers.
            newIntensityArgs[intensityArg.name] = Number(lastRunResult.intensityArgs[intensityArg.name]) + Number(intensityArg.step);
        }

        this.lastMaxSummary = lastRunResult

        return new types.Result({
            value: {
                nextArgs: newIntensityArgs
            }
        });
    } else {
        if (lastRunMetric == this.slo.value) {
            finalResults = {
                intensityArgs: this.summaries[this.summaries.length - 1].intensityArgs,
                qos: lastRunMetric
            }

            return new types.Result({
                value: {
                    finalResults: finalResults
                }
            });
        }

        if (this.summaries.length == 1) {
            return new types.Result({
                error: "No intensities can match sla goal"
            });
        }

        finalSummary = this.summaries[this.summaries.length - 2]

        // The last run went over the goal, so we use the previous run's intensity args
        finalResults = {
            intensityArgs: finalSummary.intensityArgs,
            qos: finalSummary.qos
        }

        return new types.Result({
            value: {
                finalResults: finalResults
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
    logger.log('info', `Last run throughput metric ${lastRunMetric}, slo value: ${this.slo.value}`);

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
                finalResults: this.lastMaxSummary
            }
        });
    }

    this.lastMaxRuns += 1;

    newIntensityArgs = {}
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        intensityArg = this.loadTest.intensityArgs[i];
        // NOTE There is a chance that variable intesnityArgs is string and
        // intensityArg.step is string too. We want the sum of two number instead of
        // two strings. As a result, we use `Number` to ensure the arguments are numbers.
        newIntensityArgs[intensityArg.name] = Number(lastRunResult.intensityArgs[intensityArg.name]) + Number(intensityArg.step);
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

Calibration.prototype.createCalibrationFunc = function() {
    let that = this;
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
            image: that.loadTest.image,
            path: that.loadTest.path,
            args: args
        }
        logger.log('info',`Running calibration benchmark: ${JSON.stringify(command)}` );

        commandUtil.RunBenchmark(command, that.stageResults, {
            intensityArgs: that.argValues
        }, function(error) {
            if (error !== null && error !== undefined) {
                logger.log('info', `Found error from last run, returning best known results`);

                if (that.lastMaxSummary.qos === 0.0) {
                    done(new Error("No intensities can match sla goal"));
                    return;
                }

                logger.log('info', `Final results found:  ${JSON.stringify(that.lastMaxSummary)}`);
                that.finalResults = that.lastMaxSummary;
                done();
                return;
            }

            if (that.stageResults.length < that.runsPerIntensity) {
                logger.log('info', `Running # ${that.stageResults.length + 1} calibration run for the same intensity`);
                createCalibrationFlowFunc(that)(done);
                return;
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
                logger.log('error',`Unexpected error when finding next intensity arg: ${result.error}` );
                done(result.error);
                return;
            } else if (result.value.finalResults !== undefined) {
                logger.log('info', `Final results found:  ${JSON.stringify(result.value.finalResults)}`);
                that.finalResults = result.value.finalResults;
                done();
                return;
            }

            logger.log('info', `Setting next intensity args to ${JSON.stringify(result.value.nextArgs)}`);
            that.argValues = result.value.nextArgs;
            createCalibrationFlowFunc(that)(done);
        });
    }
}

function createCalibrationFlowFunc(that) {
    return function(done) {
<<<<<<< HEAD
<<<<<<< HEAD
        if (that.initializeType == "run" && that.initialize !== undefined && that.initialize !== null) {
=======
        if (that.initialize !== undefined && that.initialize !== null) {
>>>>>>> Use docker to start load testing instead of child spawn
=======
        if (that.initializeType == "run" && that.initialize !== undefined && that.initialize !== null) {
>>>>>>> fix typo and remove space after !
            logger.log('info', `Initializing calibration: ${JSON.stringify({
                image: that.initialize.image,
                path: that.initialize.path,
                args: that.initialize.args})}`);
<<<<<<< HEAD
<<<<<<< HEAD
            commandUtil.RunCommand(that.initialize, false, function(error, output) {
=======
            commandUtil.RunCommand(that.initialize, function(error, output) {
>>>>>>> Use docker to start load testing instead of child spawn
=======
            commandUtil.RunCommand(that.initialize, false, function(error, output) {
>>>>>>> fix typo and remove space after !
                if (error !== null) {
                    done(error);
                    return;
                }

                that.createCalibrationFunc()(done)
            })
        } else {
                that.createCalibrationFunc()(done)
        }
    }
}

Calibration.prototype.flow = function(callback) {
    var that = this;

    let commands = [];
    if (that.initializeType == "stage" && that.initialize !== undefined && that.initialize !== null) {
        commands.push(function(done) {
            console.log("Initializing calibration at beginning of stage");
            commandUtil.RunCommand(that.initialize, false, done);
        });
    }

    commands.push(createCalibrationFlowFunc(that));

    async.series(
        commands,
        function(err) {
            callback(err, {
                runResults: that.results,
                finalResults: that.finalResults
            });
        });
};

module.exports = Calibration;
