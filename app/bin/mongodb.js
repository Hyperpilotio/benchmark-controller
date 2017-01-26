const mongoose = require('mongoose');
const config = require('../config/config.js');
const os = require('os');
// A set of models
const db = {};

const Hostname = os.hostname();
const connection = mongoose.connection;
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

if (config.mongodbHost === undefined || config.mongodbDB) {
    throw new Error(`Missing required config to connect to mongodb. Host ${config.mongodbHost} Port ${config.mongodbPort}`);
}

// NOTE: DeprecationWarning: Mongoose: mpromise
// https://stackoverflow.com/questions/38138445/node3341-deprecationwarning-mongoose-mpromise
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${config.mongodbHost}:${config.mongodbPort}/${config.mongodbName}`);

connection.on('error', function(err){
    console.log(`connection error: ${err}.\nHost ${config.mongodbHost} Port ${config.mongodbPort}`);
    process.exit(1);
});
connection.once('open', function() {
    console.log(`Successfully connect to mongo!\nmongodb://${config.mongodbHost}:${config.mongodbPort}/${config.mongodbName}`);
});

const MetricSchema = new Schema({
    // _id: ObjectId,
    createdAt: {
        type: Date,
        default: Date.now
    },
    host: {
        type: String,
        default: Hostname
    },
    stat: {
        type: Schema.Types.Mixed
    }
});

MetricSchema.methods = {
    saveMetric: function(stat) {
        const fieldObj = {};

        for (let key in stat) {
            fieldObj[key] = stat[key];
        }

        this.stat = fieldObj;
        return this.save(function(err){
            if(err){
                console.log(`Unable to save metric: ${err}`);
            }
        });
    }
};

// FIXME measurement === config.mongodbDB remember to modify doc, readme, dockerfile config, postman payload
const Metric = mongoose.model('Metric', MetricSchema);
db.Metric = Metric;

module.exports = db;
