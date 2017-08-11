const path = require('path');

const PARSER_DATASET = {
    'default': [{
        'input': 'Hyperpilot is awesome',
        'expect': {
            '0': 'Hyperpilot is awesome'
        }
    }],
    'redis': [
        {
            'input': `"PING_INLINE","23809.52"
"PING_BULK","58823.53"
"SET","58823.53"
"GET","58823.53"
"INCR","52631.58"
"LPUSH","55555.56"
"RPUSH","58823.53"
"LPOP","55555.56"
"RPOP","52631.58"
"SADD","58823.53"
"SPOP","55555.56"
"LPUSH (needed to benchmark LRANGE)","55555.56"
"LRANGE_100 (first 100 elements)","35714.29"
"LRANGE_300 (first 300 elements)","20408.16"
"LRANGE_500 (first 450 elements)","15873.02"
"LRANGE_600 (first 600 elements)","12820.51"
"MSET (10 keys)","52631.58"`,
            'expect': {
                'PING_INLINE': '23809.52',
                'PING_BULK': '58823.53',
                'SET': '58823.53',
                'GET': '58823.53',
                'INCR': '52631.58',
                'LPUSH': '55555.56',
                'RPUSH': '58823.53',
                'LPOP': '55555.56',
                'RPOP': '52631.58',
                'SADD': '58823.53',
                'SPOP': '55555.56',
                'LPUSH (needed to benchmark LRANGE)': '55555.56',
                'LRANGE_100 (first 100 elements)': '35714.29',
                'LRANGE_300 (first 300 elements)': '20408.16',
                'LRANGE_500 (first 450 elements)': '15873.02',
                'LRANGE_600 (first 600 elements)': '12820.51',
                'MSET (10 keys)': '52631.58'
            }
        }
    ]
};

const BENCHMARK_DATASET = {
    'flow': [{
        'input': {
            'options': {
                'loadTest':
                {
                    'image': 'alpine:3.4',
                    'path': 'echo',
                    'args': ['Hyperpilot is wonderful!']
                },
                'runsPerIntensity': 2,
                'intensity': 1
            },
            'parser': function () {
                class parser {
                    constructor() {
                    }
                    processLines(lines) {
                        let benchmarkObj = {};
                        for (let i in lines) {
                            // There might be an empty line at the end somewhere.
                            if (lines[i] === '' || lines[i] === '\n') {
                                continue;
                            }
                            let columns = lines[i].split('\n');
                            benchmarkObj[i] = columns[0];
                        }
                        return benchmarkObj;
                    }
                }
                return new parser();
            },
        },
        'expect': {
            'intensity': 1,
            'results': {
                '0': 'Hyperpilot is wonderful!'
            }
        }
    }],
    'run': [{
        'input': {
            'options': {
                'loadTest': {}
            },
            'commandObj': {
                'image': 'alpine:3.4',
                'path': 'echo',
                'args': ['Hyperpilot is awesome']
            },
            'parser': function () {
                class parser {
                    constructor() {
                    }
                    processLines(lines) {
                        let benchmarkObj = {};
                        for (let i in lines) {
                            // There might be an empty line at the end somewhere.
                            if (lines[i] === '' || lines[i] === '\n') {
                                continue;
                            }
                            let columns = lines[i].split('\n');
                            benchmarkObj[i] = columns[0];
                        }
                        return benchmarkObj;
                    }
                }
                return new parser();
            },
            'intensity': 1
        },
        'expect': {
            'intensity': 1,
            results: {
                '0': 'Hyperpilot is awesome'
            }
        }
    }]
};

console.log(path.resolve('lib', 'hyerpilot_redis_parser.js'))

const PARSER_UTIL_DATASET = {
    'input': {
        'redis': {
            'stageId': 'hyperpilot_redis_parser',
            'url': 'https://s3.amazonaws.com/hyperpilot-benchmark-parsers/redis/parser.js',
            'data': `"PING_INLINE","23809.52"
"PING_BULK","58823.53"
"SET","58823.53"
"GET","58823.53"
"INCR","52631.58"
"LPUSH","55555.56"
"RPUSH","58823.53"
"LPOP","55555.56"
"RPOP","52631.58"
"SADD","58823.53"
"SPOP","55555.56"
"LPUSH (needed to benchmark LRANGE)","55555.56"
"LRANGE_100 (first 100 elements)","35714.29"
"LRANGE_300 (first 300 elements)","20408.16"
"LRANGE_500 (first 450 elements)","15873.02"
"LRANGE_600 (first 600 elements)","12820.51"
"MSET (10 keys)","52631.58"`
        }
    },
    'expect': {
        'redis': {
            'path': path.resolve('lib', 'hyperpilot_redis_parser.js'),
            'output': {
                'PING_INLINE': '23809.52',
                'PING_BULK': '58823.53',
                'SET': '58823.53',
                'GET': '58823.53',
                'INCR': '52631.58',
                'LPUSH': '55555.56',
                'RPUSH': '58823.53',
                'LPOP': '55555.56',
                'RPOP': '52631.58',
                'SADD': '58823.53',
                'SPOP': '55555.56',
                'LPUSH (needed to benchmark LRANGE)': '55555.56',
                'LRANGE_100 (first 100 elements)': '35714.29',
                'LRANGE_300 (first 300 elements)': '20408.16',
                'LRANGE_500 (first 450 elements)': '15873.02',
                'LRANGE_600 (first 600 elements)': '12820.51',
                'MSET (10 keys)': '52631.58'
            }
        }
    }
};

module.exports = {
    'BENCHMARK_DATASET': BENCHMARK_DATASET,
    'PARSER_DATASET': PARSER_DATASET,
    'PARSER_UTIL_DATASET': PARSER_UTIL_DATASET
};
