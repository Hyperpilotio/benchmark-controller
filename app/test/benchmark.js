const assert = require('assert');
const BENCHMARK_DATASET = require('./test-data').BENCHMARK_DATASET;

describe('lib/benchmark', function () {
    const Benchmark = require('../lib/benchmark');
    const commandUtil = require('../lib/commandUtil');
    describe('#flow()', function () {
        it('should successfully return data when a set of command is given',
            function (done) {
                this.timeout(6000);
                const input = BENCHMARK_DATASET.flow[0].input;
                const expect = BENCHMARK_DATASET.flow[0].expect;
                const parser = input.parser();
                const benchmark = new Benchmark(input.options, parser);
                benchmark.flow(function (err, res) {
                    assert.ifError(err);
                    assert.deepEqual(res[0], expect);
                    done();
                });
            });
    });
    describe('#run()', function () {
        results = []
        it('should successfully return data when a command is given',
            function (done) {
                this.timeout(3000);
                const input = BENCHMARK_DATASET.run[0].input;
                const expect = BENCHMARK_DATASET.run[0].expect;
                const parser = input.parser();
                commandUtil.RunBenchmark(input.commandObj,
                    parser,
                    results,
                    { intensity: input.intensity },
                    function (err) {
                        assert.ifError(err);
                        assert.deepEqual(
                            results[0],
                            expect);
                        done();
                    });
            });
    });
});
