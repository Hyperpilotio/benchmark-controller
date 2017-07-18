/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');
const logger = require('../config/logger');

function Benchmark(options, parser) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }
    this.initialize = options.initialize;
    this.initializeType = commandUtil.SetDefault(options.initializeType, "run");
    this.loadTest = options.loadTest;
    this.intensity = options.intensity;
    this.cleanup = options.cleanup;
    this.runsPerIntensity = commandUtil.SetDefault(options.runsPerIntensity, 3);
    this.results = [];
    this.parser = parser;
}

function createRunFunc(that) {
    return function(done) {
        commandUtil.RunBenchmark(that.loadTest, that.parser, that.results, {
            intensity: that.intensity
        }, done);
    };
}

Benchmark.prototype.flow = function(callback) {
    var that = this;
    var funcs = []

    if (that.initializeType == "stage" && that.initialize !== undefined && that.initialize !== null) {
        logger.log("Initializing benchmark on each stage");
        initialize = that.initialize;
        funcs.push(function(done) {
            commandUtil.RunCommand(initialize, false, done);
        });
    }

    for (i = 0; i < that.runsPerIntensity; i++) {
        if (that.initializeType == "run" && that.initialize !== undefined && that.initialize !== null) {
            logger.log('info', 'Initializing benchmark on each run');
            initialize = that.initialize;
            funcs.push(function(done) {
                commandUtil.RunCommand(initialize, false, done);
            });
        }
        funcs.push(createRunFunc(that));
        if (that.cleanup !== undefined && that.cleanup !== null) {
            logger.log('info', 'Cleaning up benchmark');
            cleanup = that.cleanup;
            funcs.push(function(done) {
                commandUtil.RunCommand(cleanup, false, done);
            });
        }
    }

    async.series(
        funcs,
        function(err) {
            callback(err, that.results);
        });
};

module.exports = Benchmark;
