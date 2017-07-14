const winston = require('winston');
const config = require('./config');

const logger = new (winston.Logger)({
    transports: [

      new (winston.transports.Console)({
          'timestamp':true,
          'colorize': 'all',
          'level': config.logLevel ? config.logLevel : 'info'
      }),
      new (winston.transports.File)({
          'filename': '/tmp/benchmark-controller-verbose.log',
          'level': 'debug'
      })
    ]
});

module.exports = logger;
