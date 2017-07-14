/**
 * This parserUtil.js aims at provide useful functions to manage parsers for multiple workloads
 */

const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const request = require('request');

const generateParserPath = function (stageID) {
    const dest = config.parserStoragePath ? config.parserStoragePath : '/tmp';
    return path.join(dest, `${stageID}.js`);
}

const downloadParserAsync = function (dest, url) {
    return new Promise(function (resolve, reject) {
        const req = request.get(url);
        // verify response code
        req.on('response', function (response) {
            if (response.statusCode !== 200) {
                reject(new Error(`Response status was ${response.statusCode}`));
            }
        });

        // check for request errors
        req.on('error', function (err) {
            fs.unlink(dest, (err) => {
                logger.log('warn', 'Failed to unlink file ${dest}');
            });
            reject(new Error(err.message));
        });

        const file = fs.createWriteStream(dest);
        file.on('finish', function () {
            // close() is async, call cb after close completes.
            resolve(file.close());
        });

        file.on('error', function (err) {
            // Delete the file async. (But we don't check the result)
            fs.unlink(dest, (err) => {
                logger.log('warn', 'Failed to unlink file ${dest}');
            });
            reject(err.message);
        });

        req.pipe(file);
    });
}

/**
 * 
 * @param {string} stageID 
 * @param {string} url 
 * @param {object} options 
 */
const CreateParserAsync = async function(stageID, url, options) {
    const dest = generateParserPath(stageID);
    return downloadParserAsync(dest, url).then(()=>{
        return new (require(dest))(options);
    });
}

module.exports = {
    'CreateParserAsync': CreateParserAsync
};
