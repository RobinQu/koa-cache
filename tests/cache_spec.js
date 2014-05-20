/*jshint esnext: true */

var koa = require("koa"),
    co = require("co"),
    expect = require("chai").expect,
    Router = require("koa-router"),
    Cache = require("../lib/cache"),
    thunkify = require("thunkify"),
    request = require("superagent");

describe("Cache middleware", function() {
  var port = 9999;
  var app = koa();
  var cache = new Cache();
  var r = new Router();
  
  r.get("/data", cache.all(), function*() {
    this.body = "hello";
    this.cacheKey();
  });
  
  app.use(r.middleware());
  app.listen(port);
  
  var get = thunkify(request.get);
  
  it("should hit cache using url as references", function(done) {
    
    co(function*() {
      var res = yield get("http://localhost:" + port +"/data");
      // console.log(res);
      expect(res.headers["X-KOA-CACHE-HIT"]).to.be.ok;
    })(done);
    
  });
  
});