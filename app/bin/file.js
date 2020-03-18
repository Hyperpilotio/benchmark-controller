const fs = require('fs')
const db = {};

class FileLogger {
    SaveMetric(stat) {
        fs.appendFile("/tmp/metrics", stat, err => {
          if (err) {
            return console.log(err);
          }
        });
     }
}

db.Metric = FileLogger
module.exports = db
