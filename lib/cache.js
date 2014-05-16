/*jshint esnext:true */

var RedisStore = require("./redis_store"),
    redis = require("redis"),
    debug = require("debug")("koa-cache:middleware");

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
  
  app.context.cache = function*(key, value) {
    if(!key) {//get cache by session key
      key = this.cacheKey();
      return key ? self.store.get(key) : null;
    }
    
    if(value) {//setter
      this.cacheKey(key);
      yield self.store.save(key, value);
    } else {
      yield self.store.get(key);
    }
  };
  
  app.context.cacheKey = function(key) {
    this.session.cacheKeys = this.session.cacheKeys || {};
    if(key) {
      this.session.cacheKeys[this.req.url] = key;
    } else {
      return this.session.cacheKeys[this.req.url] || this.cacheKey || this.req.url;
    }
  };
  
  app.context.invalidate = function*(key) {
    if(key) {
      yield self.store.invalidate(key);
    } else {
      yield self.store.invalidate(this.cacheKey());
      delete this.session.cacheKeys[this.req.url];
    }
  };
  
};

cache.all = function() {
  // var self = this;
  return function*(next) {
    var value;
    value = yield this.cache();
    if(value) {
      debug("hit");
      this.body = value;
      return;
    }
    yield next;
    if(this.body) {
      yield this.cache(this.cacheKey(), this.body);
    }
  };
};

cache.match = function(matcher) {
  return function*(next) {
    var ret, value;
    ret = yield matchr.call(this);
    if(ret) {//should continue or not
      value = yield this.cache();
      if(value) {
        debug("hit");
        this.body = value;
        return;
      }
    }
    yield next;
    if(this.body) {
      yield this.cache(this.cacheKey(), this.body);
    }
  };
};


module.exports = CacheMiddleware;