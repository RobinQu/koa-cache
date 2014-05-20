/*jshint esnext:true */

var co = require("co"),
    expect = require("chai").expect;

describe("RedisStore", function() {
  var wait = function(time) {
    return function(callback) {
      setTimeout(callback, time*1000);
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
      yield wait(1);
      ret = yield store.get(fixtures[0].key);
      expect(ret).not.to.be.ok;
    })(done);
  });
  
  it("should touch to extend ttl", function(done) {
    co(function*() {
      yield store.set(fixtures[0].key, fixtures[0].value, 30);
      yield store.touch(fixtures[0].key, 100);
      var ttl = yield client.ttl.bind(client, store.key(fixtures[0].key));
      expect(ttl).to.be.above(30);
    })(done);
  });
  
  it("should invalidate", function(done) {
    co(function*() {
     yield store.set(fixtures[0].key, fixtures[0].value); 
     yield store.invalidate(fixtures[0].key);
     var ret = yield store.get(fixtures[0].key);
     expect(ret).not.to.be.ok;
    })(done);
  });
  
});