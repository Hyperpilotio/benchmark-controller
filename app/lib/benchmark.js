/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');

function Benchmark(options) {
    if (options.loadTest === undefined || options.loadTest === null) {
        throw new Error("Load test not found in benchmark");
    }
    this.initialize = options.initialize;
    this.loadTest = options.loadTest;
    this.intensity = options.intensity;
    this.cleanup = options.cleanup;
    this.runsPerIntensity = commandUtil.SetDefault(options.runsPerIntensity, 5);
    this.results = []
}

function createRunFunc(that) {
    return done => {
      commandUtil.RunBenchmark(that.loadTest, that.results, {
        intensity: that.intensity
      }, done);
    };
}

Benchmark.prototype.flow = function(callback) {
    var that = this;
    var funcs = []


    for (i = 0; i < that.runsPerIntensity; i++) {
        if (that.initialize !== undefined && that.initialize !== null) {
            console.log("Initializing benchmark")
            initialize = that.initialize;
            funcs.push(done => {
              commandUtil.RunCommand(initialize, done);
            });
        }
        funcs.push(createRunFunc(that));
        if (that.cleanup !== undefined && that.cleanup !== null) {
            console.log("Cleaning up benchmark")
            cleanup = that.cleanup;
            funcs.push(done => {
              commandUtil.RunCommand(cleanup, done);
            });
        }
    }

    async.series(
        funcs,
    err => {
      callback(err, that.results);
    });
};

module.exports = Benchmark;