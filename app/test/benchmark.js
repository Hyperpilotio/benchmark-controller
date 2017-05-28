const assert = require('assert');
const BENCHMARK_DATASET = require('./test-data').BENCHMARK_DATASET;

describe('lib/benchmark', function() {
  const Benchmark = require('../lib/benchmark');
  describe('#flow()', function() {
    it('should successfully return data when a set of command is given',
    function(done) {
      const benchmark = new Benchmark(BENCHMARK_DATASET.flow[0].input.options);
      benchmark.flow(function(err, res) {
          assert.deepEqual(res, BENCHMARK_DATASET.flow[0].expect);
          done();
        });
    });
  });
  describe('#run()', function() {
      it('should successfully return data when a command is given',
      function(done) {
        const benchmark = new Benchmark(BENCHMARK_DATASET.run[0].input.options);
        benchmark.run(BENCHMARK_DATASET.run[0].input.commandObj,
                      BENCHMARK_DATASET.run[0].input.intensity,
                      function() {
                        assert.deepEqual(
                          benchmark.results[0],
                          BENCHMARK_DATASET.run[0].expect);
                        done();
                      });
      });
    });
});
