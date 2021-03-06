const assert = require('assert');
const server = require('../bin/benchmarks-ui').app;
const request = require('request');
const util = require('./util');

describe('Start server', function() {
  let instance = {};
  before(function() {
    instance = server();
  });
  after(function() {
    instance.close();
  });

  describe('#post.("/")', function() {
    it('should return error message in JSON format when error happens',
    function(done) {
      request.post('http://localhost:6001', {},
      function(err, res, body) {
        assert.equal(400, res.statusCode);
        assert.equal(util.isJSON(res.body), true);
        done();
      });
    });
  });

  describe('#post.("/api/benchmarks")', function() {
    it('should return error message in JSON format when error happens',
    function(done) {
      request.post('http://localhost:6001/api/benchmarks', {},
      function(err, res, body) {
        assert.equal(400, res.statusCode);
        assert.equal(util.isJSON(res.body), true);
        done();
      });
    });
  });
});
