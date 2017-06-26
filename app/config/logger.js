const winston = require('winston');

const logger = new (winston.Logger)({
    transports: [

      new (winston.transports.Console)({'timestamp':true, 'colorize': true}),
        new (winston.transports.File)({
            'filename': '/tmp/benchmark-controller.log'
        })
    ]
});

module.exports = logger;