/*jshint esnext:true */

var co = require("co"),
    expect = require("chai").expect;

describe("RedisStore", function() {
  var wait = function(time) {
    return function(callback) {
      setTimeout(callback, time);
    };
  };
  
  var RedisStore = require("../lib/redis_store");
  
  var client = require("redis").createClient();
  
  var store = new RedisStore({
    redis: client
  });
  
  
  var fixtures = [{
    key: Date.now()+"",
    value: Date.now()+""
  }];
  
  it("should have set value", function(done) {
    co(function*() {
      yield store.set(fixtures[0].key, fixtures[0].value);
      var ret = yield store.get(fixtures[0].key);
      expect(ret).to.equal(fixtures[0].value);
    })(done);
  });
  
  it("should expire", function(done) {
    co(function*() {
      var ret;
      yield store.set(fixtures[0].key, fixtures[0].value, 1);
      //wait to expire
      yield wait(10);
      ret = yield store.get(fixtures[0].key);
      expect(ret).not.to.be.ok;
    })(done);
  });
  
});