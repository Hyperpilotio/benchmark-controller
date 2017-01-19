var fs = require('fs');
var os = require('os');
var uuid = require('node-uuid');
var querystring = require("querystring");
var request = require('request');
var Influx = require('influx');

const config = require('../config/config.js');

// FIXME api payload
var measurement = 'redis/benchmark';

// create InfluxDB database
request.get('http://' + config.influxdbHost + ':' + config.influxdbPort + '/query?q=' + querystring.escape('CREATE DATABASE ' + config.influxdbName));

// init InfluxDB client
const influx = new Influx.InfluxDB({
  host: config.influxdbHost,
  port: config.influxdbPort,
  database: config.influxdbName
});

influx.insertInflux = function(input) {
    // init write influxDb fields Object
    let fieldObj = {};
    fieldObj.uuid = uuid.v1();

    for (let key in input) {
        fieldObj[key] = input[key];
    }

    influx.writePoints([{
        measurement: measurement,
        tags: {
            host: os.hostname()
        },
        fields: fieldObj
    }]);
};

module.exports = influx;
