const mongoose = require('mongoose');
const config = require('../config/config.js');
const os = require('os');
// A set of models
const db = {};

const Hostname = os.hostname();
const connection = mongoose.connection;
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const host = config.store.host;
const port = config.store.port;
const dbName = config.store.dbName;
if (host === undefined || port === undefined || dbName === undefined) {
    throw new Error(`Missing required config to connect to mongodb. Host ${host} Port ${port} DB ${dbName}`);
}

// NOTE: DeprecationWarning: Mongoose: mpromise
// https://stackoverflow.com/questions/38138445/node3341-deprecationwarning-mongoose-mpromise
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${host}:${port}/${dbName}`);

connection.on('error', function(err){
    console.log(`connection error: ${err}.\nHost ${host} Port ${port}`);
    process.exit(1);
});
connection.once('open', function() {
    console.log(`Successfully connect to mongo!\nmongodb://${host}:${port}/${dbName}`);
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
