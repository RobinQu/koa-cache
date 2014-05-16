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
  
  app.context.cache = function*(value, expires) {
    var key = this.cacheKey || this.req.url;
    if(arguments.length <= 1) {//getter
      return yield self.store.get(key);
    }
    this.cached = true;
    yield self.store.set(key, value, expires);
  };
  
  app.context.invalidate = function*(key) {
    yield self.store.invalidate(key || this.cacheKey || this.req.url);
  };
  
};

cache.all = function() {
  var self = this;
  return function*(next) {
    var value;
    value = yield self.cache();
    if(value) {
      debug("hit");
      this.body = value;
      return;
    }
    yield next;
    if(!cached && this.body) {//write default cache
      yield this.cache(this.req.url, this.body);
    }
  };
};

cache.match = function(matcher) {
  return function*(next) {
    var ret, value;
    ret = yield matchr.call(this);
    if(ret) {//should continue or not
      value = yield self.cache();
      if(value) {
        debug("hit");
        this.body = value;
        return;
      }
    }
    yield next;
    if(!cached && this.body) {//write default cache
      yield this.cache(this.req.url, this.body);
    }
  };
};


module.exports = CacheMiddleware;