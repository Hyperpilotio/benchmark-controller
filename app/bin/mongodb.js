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

mongoose.connect(`mongodb://${config.mongodbHost}:${config.mongodbPort}/${config.mongodbName}`);

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
    console.log("Successfully connect!");
});

const StatSchema = new Schema({
    // _id: ObjectId,
    createdAt: {
        type: Date,
        default: Date.now
    },
    host: {
        type: String,
        default: Hostname
    }
    // Store stats
}, {
    strict: false
});

StatSchema.method = {
    saveStat: function(stat) {
        const fieldObj = {};

        for (let key in stat) {
            fieldObj[key] = stat[key];
        }

        this.stat = fieldObj;
        return this.save();
    }
};

// FIXME measurement === config.mongodbDB remember to modify doc, readme, dockerfile config, postman payload
const Stat = mongoose.model('Stat', StatSchema);
db.Stat = Stat;

module.exports = db;
