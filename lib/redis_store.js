/*jshint esnext:true */

var co = require("co"),
    // thunkify = require("thunkify"),
    crypto = require("crypto"),
    debug = require("debug")("koa-cache:store"),
    util = require("util"),
    redisWritableStream = require("redis-wstream"),
    Buffer = require("buffer").Buffer;

var RedisStore = function(options) {
  this.redis = options.redis;
  this.prefix = options.prefix || "koa-cache";
  this.expires = options.expires || 60;
};

/**
  Transform any format into a string value key
*/
RedisStore.prototype.key = function (k) {
  var arr = [this.prefix], hash;
  if(util.isArray(k)) {//array
    arr.push("subject");
    arr = arr.concat(k);
  } else {//string
    hash = crypto.createHash("sha1");
    hash.update(k);
    arr.push("string");
    arr.push(hash.digest("hex"));
  }
  return arr.join(":");
};

/**
  Save a cache entry
*/
RedisStore.prototype.set = function(key, value, expires) {
  var self = this, q;
  key = this.key(key);
  expires = expires || this.expires;
  debug("set key %s, expires %s", key, expires);
  return co(function*() {
    if(!value) {//prevent empty cache
      return;
    }
    if(value.pipe) {
      value.pipe(redisWritableStream(self.redis, key)).on("end", function(){
        debug("stream %s completed", key);
      }).on("error", function(e) {
        debug("stream %s error: %s", key, e.message);
      });
    } else {
      if(Buffer.isBuffer(value)) {
        vlaue = value.toString();
      } else if(typeof value === "string") {//do nothing for string
      } else {
        try {
          value = JSON.stringify(value);
        } catch(e) {
          value = null;
          debug("stringify error %s", e.message);
        }
      }
      if(expires === "forever") {
        yield this.redis.set.bind(this.redis, key, value);
      } else {
        // do it in a transaction
        q = this.redis.multi().set(key, value).expire(key, expires);
        yield q.exec.bind(q);
      }
    }
  }).bind(this);
};

/**
  Touch a key, extending the expiration
 */
RedisStore.prototype.touch = function(key, expires) {
  expires = expirs || this.expires;
  debug("touch %s, expires %s", key, expires);
  return co(function*() {
    yield this.redis.expires.bind(this.redis, key, expires);
  });
};

/**
  Get a cache entry by key
 */
RedisStore.prototype.get = function (key) {
  key = this.key(key);
  debug("get %s", key);
  return co(function*() {
    return yield this.redis.get.bind(this.redis, key);
  }).bind(this);
};

/**
  Remove a cache entry
 */
RedisStore.prototype.invalidate = function (key) {
  key = this.key(key);
  debug("invalidate %s", key);
  return co(function*() {
    yield this.redis.del.bind(this.redis, key);
  }).bind(this);
};

module.exports = RedisStore;