const assert = require('assert');
const PARSER_UTIL_DATASET = require('./test-data').PARSER_UTIL_DATASET;
const parserUtil = require('../lib/parserUtil');
const fs = require('fs');

describe('ParserUtil', function () {
    describe('#redis', function () {
        it('should download the parser if an url is given',
            async function () {
                this.timeout(1000);
                const input = PARSER_UTIL_DATASET.input.redis;
                const expect = PARSER_UTIL_DATASET.expect.redis;
                try {
                    await parserUtil.CreateParserAsync(input.stageId, input.url, {});
                    assert.equal(fs.existsSync(expect.path), true);
                } catch (e) {
                    assert.fail(e);
                }
            });
        it('should be able to parse data if a parser is created',
            async function () {
                this.timeout(1000);
                const input = PARSER_UTIL_DATASET.input.redis;
                const expect = PARSER_UTIL_DATASET.expect.redis;
                try {
                    const parser = await parserUtil.CreateParserAsync(input.stageId, input.url, {});
                    const lines = input.data.split('\n');
                    const benchmarkObj = parser.processLines(lines);
                    assert.deepEqual(benchmarkObj, expect.output);
                } catch (e) {
                    assert.fail(e);
                }
            });
    })
});

