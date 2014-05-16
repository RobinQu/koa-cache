/*jshint esnext:true */

var RedisStore = require("./redis_store"),
    redis = require("redis"),
    debug = require("debug");

var CacheMiddleware = function(options) {
  if(!(this instanceof CacheMiddleware)) {
    return new CacheMiddleware(options);
  }
  
  var client = redis.createClient(options.redis.port, options.redis.host, options.redis.clientOptions);
  
  // overwrite option hash
  options.redis = client;
  // create the store instance
  this.store = new RedisStore(options);
};

cache = CacheMiddleware.prototype;

cache.bind = function(app) {
  var self = this;
  
  app.context.cache = function*(subject, id, value, expires) {
    yield self.store.set([subject, id], value, expires);
  };
  app.context.invalidate = function*(subject, id) {
    yield self.store.invalidate([subject, id]);
  };
};

cache.all = function() {
  var self = this;
  return function*(next) {
    var value;
    value = yield self.store.get(this.cacheKey || this.req.url);
    if(value) {
      debug("hit");
      this.body = value;
      return;
    }
    yield next;
  };
};

cache.match = function(matcher) {
  return function*(next) {
    var ret, value;
    ret = yield matchr.call(this);
    if(ret) {//should continue or not
      value = yield cache.store.get(this.cacheKey || this.req.url);
      if(value) {
        debug("hit");
        this.body = value;
        return;
      }
    }
    yield next;
  };
};


module.exports = CacheMiddleware;