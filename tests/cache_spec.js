/*jshint esnext: true */

var koa = require("koa"),
    co = require("co"),
    expect = require("chai").expect,
    Router = require("koa-router"),
    Cache = require("../lib/cache"),
    request = require("co-request");

describe("Cache middleware", function() {
  
  var app;
  beforeEach(function() {
    if(app) {
      return;
    }
    app = require("./app");
  });
  
  it("should hit cache using url as references", function(done) {
    co(function*() {
      var res;
      // warm cache
      res = yield request("http://localhost:9090/data");
      // console.log(res.headers);
      // hit cache
      res = yield request("http://localhost:9090/data");
      expect(res.body).to.be.ok;
      
      expect(res.headers["x-koa-cache-hit"]).to.be.ok;
    })(done);
    
  });
  
  describe("Session cache key", function() {
    it("should miss cache if session key not matched", function() {
      co(function*() {
        var res;
        // will never hit a cache if we are not requesting with cookies
        res = yield request("http://localhost:9090/private?user=a");
        res = yield request("http://localhost:9090/private?user=a");
        expect(res.headers["x-koa-cache-hit"]).not.to.be.ok;
      });
    });
    
    it("should hit cache in subsequent requests during a session", function(done) {
      co(function*() {
        var jar1 = request.jar(), res;
        res = yield request("http://localhost:9090/private?user=a", {jar:jar1});
        expect(res.headers["x-koa-cache-hit"]).not.to.be.ok;
        // console.log(res.headers);
        res = yield request("http://localhost:9090/private?user=a", {jar:jar1});
        expect(res.headers["x-koa-cache-hit"]).to.be.ok;
        // console.log(res.headers);
        expect(res.body).to.equal("private:a");
        
        res = yield request("http://localhost:9090/private?user=a");
        expect(res.headers["x-koa-cache-hit"]).not.to.be.ok;
        
      })(done);
    });
    
  });
  
  it("should match before reading cache", function(done) {
    co(function*() {
      var res, jar;
      jar = request.jar();
      res = yield request("http://localhost:9090/match?user=a", {jar:jar});
      expect(res.headers["x-koa-cache-hit"]).not.to.be.ok;
      
      // session key is saved; query `user=a` will give us cache result
      res = yield request("http://localhost:9090/match?user=a", {jar:jar});
      expect(res.headers["x-koa-cache-hit"]).to.be.ok;
      
      // changeing a user in the session, will have no cache
      res = yield request("http://localhost:9090/match?user=c", {jar:jar});
      expect(res.headers["x-koa-cache-hit"]).not.to.be.ok;
      
      
    })(done);
  });
  
  
  
});