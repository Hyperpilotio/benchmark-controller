class Parser {
  constructor(options) {
    this.isVerbose = (options === undefined || options.verbose === undefined) ? false : options.verbose;
  }

  processLines(lines = []) {
    let benchmarkObj = {};
    for (let i in lines) {
      // There might be an empty line at the end somewhere.
      if (lines[i] === '' || lines[i] === '\n') {
        continue;
      }
      let columns = lines[i].split('\n');
      benchmarkObj[i] = columns[0];
    }

    return benchmarkObj;
  }
}

module.exports = Parser;
