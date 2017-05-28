const assert = require('assert');
const PARSER_DATASET = require('./test-data').PARSER_DATASET;

describe('Parser', function() {
  describe('#default', function() {
      it('should successfully parse data that when a commend is given',
      function() {
        for (let i in PARSER_DATASET.default) {
          const Parser = require('../extension-lib/parser');
          const parser = new Parser({});
          const lines = PARSER_DATASET.default[i].input.split('\n');
          const benchmarkObj = parser.processLines(lines);
          assert.deepEqual(benchmarkObj, PARSER_DATASET.default[i].expect);
        }
      });

    });
  describe('#redis', function() {
    it('should successfully parse the result of redis-benchmark',
    function() {
        for (let i = 0; i < PARSER_DATASET.redis.length; i ++) {

          const Parser = require('../extension-lib/redis');
          const parser = new Parser({});
          const lines = PARSER_DATASET.redis[i].input.split('\n');
          const benchmarkObj = parser.processLines(lines);

          assert.deepEqual(benchmarkObj, PARSER_DATASET.redis[i].expect);
        }
      });
  });
});

