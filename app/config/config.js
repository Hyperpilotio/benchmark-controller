const fs = require('fs');
const path = require('path');

// Load the configuration from the config file.
const configFile = path.join(__dirname, "config.json");

// default configuration
var config = {
    influxdbHost: "influxsrv",
    influxdbPort: "8086",
    influxdbName: "redis",
    benchmark_cmd: "/usr/local/bin/redis-benchmark"
};

try {
    config = Object.assign(config, JSON.parse(fs.readFileSync(configFile)));
} catch (e) {
    // Quit if the config file can't be read
    console.log("Error parsing %s - %s", configFile, e);
    process.exit(1);
}

module.exports = config;
