/*jshint esnext:true */

var RedisStore = require("./redis_store"),
    redis = require("redis"),
    debug = require("debug")("koa-cache:middleware");

var CacheMiddleware = function(options) {
  if(!(this instanceof CacheMiddleware)) {
    return new CacheMiddleware(options);
  }
  var client;
  options = options || {};
  if(options.redis) {
    client = redis.createClient(options.redis.port, options.redis.host, options.redis.clientOptions);
  } else {
    client = redis.createClient();
  }
  // overwrite option hash
  options.redis = client;
  // create the store instance
  this.store = new RedisStore(options);
};

cache = CacheMiddleware.prototype;

cache.bind = function(app) {
  
  debug("bind app");
  
  var self = this;
  
  app.context.cache = function*(key, value) {
    if(!key) {//get cache by session key
      key = this.cacheKey();
      debug("get cache in session %s", key);
      return key ? (yield self.store.get(key)) : null;
    }
    if(value) {//setter
      debug("save cache explictly");
      this.cacheKey(key);
      yield self.store.set(key, value);
    } else {
      debug("read cache %s", key);
      yield self.store.get(key);
    }
  };
  
  /**
    Session-aware cache.
   */
  app.context.cacheKey = function(key) {
    this.session.cacheKeys = this.session.cacheKeys || {};
    if(key) {//set
      debug("setup session key %s", key);
      this.session.cacheKeys[this.req.url] = key;
    } else {//get
      debug("get session key");
      return this.session.cacheKeys[this.req.url] || this.req.url;
    }
  };
  
  /**
    Delete a cache entry
   */
  app.context.invalidate = function*(key) {
    if(key) {
      debug("invalidate explict key %s", key);
      yield self.store.invalidate(key);
    } else {
      debug("invalidate explict session key");
      yield self.store.invalidate(this.cacheKey());
      delete this.session.cacheKeys[this.req.url];
    }
  };
  
};

cache.all = function() {
  return this.match();
};

cache.match = function(matcher) {
  return function*(next) {
    debug("pre cache");
    var ret, value;
    if(matcher) {
      ret = yield matcher.call(this);
    } else {
      ret = true;
    }
    if(ret) {//should continue or not
      value = yield this.cache();
      if(value) {
        debug("hit");
        this.set("X-KOA-CACHE-HIT", 1);
        this.body = value;
        return;
      }
      debug("miss");
    } else {
      debug("unmatch");
    }
    yield next;
    if(this.body) {
      debug("cache");
      yield this.cache(this.cacheKey(), this.body);
    }
  };
};


module.exports = CacheMiddleware;