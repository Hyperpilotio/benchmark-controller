const fs = require('fs')
const db = {};

class FileLogger {
    SaveMetric(stat) {
        fs.appendFile("/tmp/metrics", stat, function(err) {
            if (err) {
                return console.log(err);
            }
        });
     }
}

db.Metrics = FileLogger
module.exports = db
