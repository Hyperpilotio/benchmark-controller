const assert = require('assert');

describe('lib/calibration', function() {
    const Calibration = require('../lib/calibration');
    describe('#computeNextIntensityArgs()', function() {
        it('should successfully compute next attempted intesnity when metric is below slo',
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
                   slo: {value: 100, metric: "key"}
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
    });
});
