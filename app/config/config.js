const fs = require('fs');
const path = require('path');

// Load the configuration from the config file.
const configFile = path.join(__dirname, "config.json");

// default configuration
var config = {
    mongodbHost: "mongosrv",
    mongodbPort: "27017",
    appHost: "0.0.0.0",
    appPort: 6001
};

try {
    config = Object.assign(config, JSON.parse(fs.readFileSync(configFile)));
} catch (e) {
    // Quit if the config file can't be read
    console.log("Error parsing %s - %s", configFile, e);
    process.exit(1);
}

if (config.mongodbName === undefined) {
    console.log(new Error("Required field is missing."));
    process.exit(1);
}

module.exports = config;
