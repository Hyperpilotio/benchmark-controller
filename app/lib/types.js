var exports = module.exports = {};

class Result {
  constructor({value = null, error = null} = {}) {
      this.value = value;
      this.error = null;
      if (error !== null) {
          this.error = new Error(error);
      }
  }
}

exports.Result = Result;
