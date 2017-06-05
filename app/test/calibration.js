const assert = require('assert');

describe('lib/calibration', function() {
    const Calibration = require('../lib/calibration');
    describe('#computeNextIntensityArgs()', function() {
        it('should successfully compute next attempted intesnity when latency metric is below slo',
           function(done) {
               config = {
                   initialize: {},
                   loadTest: {
                       intensityArgs: [
                           {
                               name: "argA",
                               step: 10
                           },
                           {
                               name: "argB",
                               step: 20
                           }
                       ]
                   },
                   slo: {value: 100, metric: "key", type: "latency"}
               };
               const calibration = new Calibration(config);
               calibration.results.push(
                   {
                       results: {key: 80},
                       intensityArgs: {
                           argA: 100,
                           argB: 200
                       }
                   });
               result = calibration.computeNextIntensityArgs();
               assert.equal(null, result.error);
               assert.deepEqual({argA: 110, argB: 220}, result.value.nextArgs);
               done();
           });
        it('should stop attempting next run when throughput went over slo',
           function(done) {
               config = {
                   initialize: {},
                   loadTest: {
                       intensityArgs: [
                           {
                               name: "argA",
                               step: 10
                           }
                       ]
                   },
                   slo: {value: 100, metric: "key", type: "throughput"}
               };
               const calibration = new Calibration(config);
               calibration.results.push(
                   {
                       results: {key: 101},
                       intensityArgs: {
                           argA: 20,
                       }
                   });
               result = calibration.computeNextIntensityArgs();
               assert.equal(null, result.error);
               assert.equal(undefined, result.value.nextArgs);
               assert.deepEqual({argA: 20}, result.value.finalArgs);
               done();
           });
    });
});
