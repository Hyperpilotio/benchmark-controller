const assert = require('assert');
const BENCHMARK_DATASET = require('./test-data').BENCHMARK_DATASET;

describe('lib/benchmark', function() {
  describe('#run()', function() {
      const Benchmark = require('../lib/benchmark');

      it('should successfully return data when a commend is given',
      function(done) {
        const benchmark = new Benchmark(BENCHMARK_DATASET.run[0].input.options);
        benchmark.run(BENCHMARK_DATASET.run[0].input.commendObj,
                      BENCHMARK_DATASET.run[0].input.intensity,
                      function() {
                        assert.deepEqual(
                          BENCHMARK_DATASET.run[0].expect,
                          benchmark.results[0]);
                        done();
                      });
      });
    });
});
