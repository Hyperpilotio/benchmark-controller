const fs = require('fs')
const db = {};

db.SaveMetrics = function(stat) {
  fs.appendFile("/tmp/metrics", stat, function(err) {
        if (err) {
          return console.log(err);
        }
  });
};
