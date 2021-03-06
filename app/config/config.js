const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Load the configuration from the config file.
const configFile = path.join(__dirname, "config.json");

// default configuration
var config = {
    "store": {
        "host": "mongosrv",
        "port": "27017"
    },
    'logLevel': 'info',
    "host": "0.0.0.0",
    "port": 6001
};

try {
    config = Object.assign(config, JSON.parse(fs.readFileSync(configFile)));
} catch (e) {
    // Quit if the config file can't be read
    logger.log('error', `Error parsing ${configFile} -  ${e}`);
    process.exit(1);
}

if (config.store === undefined) {
    logger.log('error', new Error("Required field is missing."));
    process.exit(1);
}

module.exports = config;
