/*jshint esnext:true */

var co = require("co"),
    thunkify = require("thunkify");

var RedisStore = function(options) {
  this.redis = options.redis;
  this.preifx = options.prefix || "koa-cache";
  this.expires = options.expires || 30;
};

/**
  Transform any format into a string value key
*/
RedisStore.prototype.key = function (k) {
  
};

/**
  Save a cache entry
*/
RedisStore.prototype.set = function(key, value, expires) {
  key = this.key(key);
  expires = expires || this.expires;
  
  return co(function*() {
    // do it in a transaction
    yield this.redis.multi().set(key, value).expire(key, expires).exec.bind(this.redis);
  }).bind(this);
};

/**
  Touch a key, extending the expiration
 */
RedisStore.prototype.touch = function(key, expires) {
  expires = expirs || this.expires;
  
  return co(function*() {
    yield this.redis.expires.bind(this.redis, key, expires);
  });
};

/**
  Get a cache entry by key
 */
RedisStore.prototype.get = function (key) {
  key = this.key(key);
  expires = expires || this.expires;
  
  return co(function*() {
    return yield this.redis.get.bind(this.redis, key);
  }).bind(this);
};

/**
  Remove a cache entry
 */
RedisStore.prototype.invalidate = function (key) {
  key = this.key(key);
  
  return co(function*() {
    yield this.redis.del.bind(this.redis, key);
  }).bind(this);
};

module.exports = Cache;