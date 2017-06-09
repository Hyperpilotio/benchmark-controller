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
    this.results = []
}

function createRunFunc(that) {
  return function(done) {
    commandUtil.RunBenchmark(that.loadTest, that.results, {intensity: that.intensity}, done);
  };
}

Benchmark.prototype.flow = function(callback) {
    var that = this;
    var funcs = []
    if (that.initialize !== undefined && that.initialize !== null) {
      initialize = that.initialize;
      funcs.push(function(done) {
        commandUtil.RunCommand(initialize, done);
      });
    }

    funcs.push(createRunFunc(that));

    if (that.cleanup !== undefined && that.cleanup !== null) {
      cleanup = that.cleanup;
      funcs.push(function(done) {
        commandUtil.RunCommand(cleanup, done);
      });
    }

    async.series(
      funcs,
      function(err) {
        // We assume one result from one load test run for now.
        callback(err, that.results[0]);
    });
};

module.exports = Benchmark;
