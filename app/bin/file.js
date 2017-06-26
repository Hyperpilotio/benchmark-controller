const fs = require('fs')
const db = {};
const logger = require('../config/logger');

class FileLogger {
    SaveMetric(stat) {
        fs.appendFile("/tmp/metrics", stat, function(err) {
            if (err) {
                return logger.log('error', err);
            }
        });
     }
}

db.Metric = FileLogger
module.exports = db;
