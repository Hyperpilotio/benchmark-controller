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
                'SPOP': '55555.56' ,
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
              'loadTests': [
                  {
                      'command': {
                          'path': 'echo',
                          'args': ['Hyperpilot is wonderful!']
                        },
                      'intensity': 1
                    },
                  {
                      'command': {
                          'path': 'echo',
                          'args': ['Hyperpilot is great!']
                        },
                      'intensity': 2
                    }
              ]
            },
        },
      'expect': [{
          'intensity': 1,
          'results': {
              '0': 'Hyperpilot is wonderful!'
            }
        },
     {
          'intensity': 2,
          'results': {
              '0': 'Hyperpilot is great!'
            }
        }]
    }],
    'run': [{
        'input': {
            'options': {
                'loadTests': []
              },
            'commandObj': {
                'path': 'echo',
                'args': ['Hyperpilot is awesome']
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

module.exports = {
    'BENCHMARK_DATASET': BENCHMARK_DATASET,
    'PARSER_DATASET': PARSER_DATASET
  };
