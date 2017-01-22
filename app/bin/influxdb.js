var fs = require('fs');
var os = require('os');
var uuid = require('node-uuid');
var querystring = require("querystring");
var request = require('request');
var Influx = require('influx');

const config = require('../config/config.js');

// create InfluxDB database
request.get('http://' + config.influxdbHost + ':' + config.influxdbPort + '/query?q=' + querystring.escape('CREATE DATABASE ' + config.influxdbName));

// init InfluxDB client
const influx = new Influx.InfluxDB({
    host: config.influxdbHost,
    port: config.influxdbPort,
    database: config.influxdbName
});

influx.insertInflux = function(input, options) {
    if (options === undefined || options.measurement === undefined || options.measurement === "") {
        throw new Error(`Measurement is undefined or is an empty string. ${options.measurement}` );
    }

    // init write influxDb fields Object
    let fieldObj = {};
    fieldObj.uuid = uuid.v1();

    for (let key in input) {
        fieldObj[key] = input[key];
    }

    influx.writePoints([{
        measurement: options.measurement,
        tags: {
            host: os.hostname()
        },
        fields: fieldObj
    }]);
};

module.exports = influx;
