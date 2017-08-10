/**
 * This parserUtil.js aims at provide useful functions to manage parsers for multiple workloads
 */

const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const request = require('request');
const logger = require('../config/logger');

const makeDirs = (filePath) => {
    let currentPath = path.isAbsolute(filePath) ? '/' : '';
    let separator = path.sep;
    let splitDir = filePath.split(separator)

    for (let i = 0; i < splitDir.length; i++) {
        currentPath = path.resolve(currentPath, splitDir[i])
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath)
        }
    }
}

const generateParserPath = function (stageID) {
    const dest = config.parserStoragePath ? config.parserStoragePath : '.';
    let rootDir = path.dirname(__filename)
    let targetDir = path.join(rootDir, dest)
    filePath = path.join(targetDir, `${stageID}.js`);
    makeDirs(targetDir)
    return filePath
}

const downloadParserAsync = function (dest, url) {
    return new Promise(function (resolve, reject) {
        const req = request.get(url);
        // verify response code
        req.on('response', function (response) {
            if (response.statusCode !== 200) {
                errMessage = `Response status was ${response.statusCode} from url ${url}`;
                logger.log('warn', `${errMessage}`);
                logger.log('verbose', `Response${response}`);
                reject(new Error(errMessage));
            }
        });

        // check for request errors
        req.on('error', function (err) {
            logger.log('warn', `Failed to download parser from ${url} to destination ${dest}
            Error message ${err.message}`);
            fs.unlink(dest, (err) => {
                logger.log('warn', `Failed to unlink file ${dest}`);
            });
            reject(new Error(err.message));
        });

        const file = fs.createWriteStream(dest);
        file.on('finish', function () {
            // close() is async, call cb after close completes.
            resolve(file.close());
        });

        file.on('error', function (err) {
            logger.log('warn', `Failed to write parser from ${url} into destination ${dest}
            Error message: ${err.message}`);
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
    // copy it into current project root directory
    let tmpFile = generateParserPath(stageID)
    return downloadParserAsync(tmpFile, url).then(()=>{
        parser = new (require(tmpFile))(options);
        console.log(JSON.stringify(parser))
        return parser
    })
}

module.exports = {
    'CreateParserAsync': CreateParserAsync
};
