/**
 * benchmarks.js - Utility module for running benchmarks cli.
 */
const util = require('util');
const async = require('async');
const commandUtil = require('./commandUtil.js');

function Benchmark(options) {
    if (options.loadTests === undefined || options.loadTests === null) {
      throw new Error("Load test not found in benchmark");
    }
    this.initialize = options.initialize;
    this.loadTests = options.loadTests;
    this.cleanup = options.cleanup;
    this.results = []
}

function createRunFunc(that, loadTest) {
  return function(done) {
    commandUtil.RunBenchmark(loadTest.command, that.results, {intensity: loadTest.intensity}, done);
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

    for (var i = 0; i < that.loadTests.length; i++) {
      funcs.push(createRunFunc(that, that.loadTests[i]));
    }

    if (that.cleanup !== undefined && that.cleanup !== null) {
      cleanup = that.cleanup;
      funcs.push(function(done) {
        commandUtil.RunCommand(cleanup, done);
      });
    }

    async.series(
      funcs,
      function(err) {
        callback(err, that.results);
    });
};

module.exports = Benchmark;
