const assert = require('assert');
const PARSER_DATASET = require('./test-data');

describe('Parser', function() {
  describe('#redis', function() {
    it('should successfully parse the result of redis-benchmark', function() {
        for (let i = 0; i < PARSER_DATASET.redis.length; i ++) {

          const Parser = require('../extension-lib/redis');
          const parser = new Parser({});
          const lines = PARSER_DATASET.redis[i].input.split('\n');
          const benchmarkObj = parser.processLines(lines);

          assert.deepEqual(PARSER_DATASET.redis[i].expect, benchmarkObj);
        }
      });
  });
});

