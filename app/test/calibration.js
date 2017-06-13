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
               calibration.summaries.push(
                   {
                       qos: 80,
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
        it('should stop attempting next run when last max runs reached',
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
               calibration.lastMaxSummary = {qos: 80};
               calibration.summaries.push(
                   {
                       qos: 50,
                       intensityArgs: {
                           argA: 20,
                       }
                   });
               calibration.lastMaxRuns = 5;
               result = calibration.computeNextIntensityArgs();
               assert.notEqual(null, result.error);
               done();
           });
    });
});
