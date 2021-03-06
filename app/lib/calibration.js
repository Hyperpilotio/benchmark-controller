/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');
const types = require('./types.js');
const logger = require('../config/logger');
const parserUtil = require('./parserUtil');

const MAX_STAGES = 50;

function Calibration(options, parser) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }

    this.initialize = options.initialize;
    this.initializeType = commandUtil.SetDefault(options.initializeType, "run");
    this.loadTest = options.loadTest;
    this.loadTest.args = commandUtil.SetDefault(this.loadTest.args, []);
    this.argValues = {};
    for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
        const intensityArg = this.loadTest.intensityArgs[i];
        this.argValues[intensityArg.name] = intensityArg.startingValue;
    }
    this.runsPerIntensity = commandUtil.SetDefault(options.runsPerIntensity, 3);
    this.slo = options.slo;
    // Results stores all the past runs for all intensities
    this.results = [];
        // Stage results stores multiple run results for the current intensity args
    this.stageResults = [];
        // Summaries stores all the summarized results from the stage results
    this.summaries = [];
        // Final intensity args stores the final calibrated intensity output
    this.finalResults = {};
    this.lastMaxSummary = {
        qos: 0.0
    };
    this.parser = parser;
}

Calibration.prototype.computeNextLatencyArgs = function() {
    if (this.summaries.length == 0) {
        return new types.Result({
            error: "No past run results found"
        });
    }

    let lastRunResult = this.summaries[this.summaries.length - 1];
    let lastRunMetric = lastRunResult.qos;

    logger.log('info', `Last run latency metric ${lastRunMetric}, slo value: ${this.slo.value}`);

    if (lastRunMetric < this.slo.value) {
        if (this.summaries.length == MAX_STAGES) {
            return new types.Result({
                error: "Maximum runs reached"
            });
        }

        let newIntensityArgs = {};
        for (i = 0; i < this.loadTest.intensityArgs.length; i++) {
            const intensityArg = this.loadTest.intensityArgs[i];
            // NOTE There is a chance that variable intesnityArgs is string and
            // intensityArg.step is string too. We want the sum of two number instead of
            // two strings. As a result, we use `Number` to ensure the arguments are numbers.
            newIntensityArgs[intensityArg.name] = Number(lastRunResult.intensityArgs[intensityArg.name]) + Number(intensityArg.step);
        }

        this.lastMaxSummary = lastRunResult;

        return new types.Result({
            value: {
                nextArgs: newIntensityArgs
            }
        });
    } else {
        if (lastRunMetric === this.slo.value) {
            return new types.Result({
                value: {
                    'finalResults': {
                        intensityArgs: this.summaries[this.summaries.length - 1].intensityArgs,
                        qos: lastRunMetric
                    }
                }
            });
        }

        if (this.summaries.length === 1) {
            return new types.Result({
                error: "No intensities can match sla goal"
            });
        }

        // The last run went over the goal, so we use the previous run's intensity args
        let { intensityArgs, qos } = this.summaries[this.summaries.length - 2]

        return new types.Result({
            value: {
                finalResults: { intensityArgs, qos }
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

    let lastRunResult = this.summaries[this.summaries.length - 1];
    let lastRunMetric = lastRunResult.qos;
    logger.log('info', `Last run throughput metric ${lastRunMetric}, slo value: ${this.slo.value}`);

    if (lastRunMetric > this.lastMaxSummary.qos) {
        this.lastMaxSummary = lastRunResult;
        this.lastMaxRuns = 0;
    }

    // TODO: Make max runs configurable
    if (this.lastMaxRuns >= 5 || this.summaries.length == MAX_STAGES) {
        if (this.slo.value > this.lastMaxSummary.qos) {
            return new types.Result({
                error: `Cannot find configuration that meets SLO, slo value: ${this.slo.value}, last max seen: ${this.lastMaxSummary.qos}`
            });
        }

        return new types.Result({
            value: {
                finalResults: this.lastMaxSummary
            }
        });
    }

    this.lastMaxRuns += 1;

    let newIntensityArgs = {}
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
Calibration.prototype.computeNextIntensityArgs = function () {
    if (this.loadTest.intensityArgs.length > 0) {
        if (this.slo.type == "throughput") {
            return this.computeNextThroughputArgs();
        } else {
            return this.computeNextLatencyArgs();
        }
    } else {
        return new types.Result({
            value: {
                finalResults: this.summaries[this.summaries.length - 1]
            }
        });
    }
}

Calibration.prototype.createCalibrationFunc = function() {
    let that = this;
    return function(done) {
        const args = that.loadTest.args.slice();
        for (i = 0; i < that.loadTest.intensityArgs.length; i++) {
            const intensityArg = that.loadTest.intensityArgs[i]
            args.push(intensityArg.arg);
            args.push(that.argValues[intensityArg.name]);
        }

        const command = {
            image: that.loadTest.image,
            path: that.loadTest.path,
            args: args
        }
        logger.log('info',`Running calibration benchmark: ${JSON.stringify(command)}` );

        commandUtil.RunBenchmark(command, that.parser, that.stageResults, {
            intensityArgs: that.argValues
        }, function(error) {
            if (error !== null && error !== undefined) {
                logger.log('error', `Found error ${error}`)
                logger.log('info', `Found error from last run, returning best known results`);

                // NOTE if the application does not have intensity arguments, return 0 as qos value
                if (that.lastMaxSummary.qos === 0.0 && that.loadTest.intensityArgs.length !== 0) {
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

            let lastRunMetrics = 0.0;
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
        if (that.initializeType == "run" && that.initialize !== undefined && that.initialize !== null) {
            logger.log('info', `Initializing calibration: ${JSON.stringify({
                image: that.initialize.image,
                path: that.initialize.path,
                args: that.initialize.args})}`);
            commandUtil.RunCommand(that.initialize, false, function(error, output) {
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

Calibration.prototype.flow = async function(callback) {
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
