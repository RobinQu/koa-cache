# koa-cache

Redis Content Cache with polcies

## Notes about Redis

### LRU

Making the cache more efficient in a limited space requires [certain eviction algorithm]( http://redis.io/topics/lru-cache) that delete entries after the memory is drained.

By default redis emploies a policy named `volatile-lru`, which only evicts keys that have been set with an expire.

You should note that **a cache entry may be deleted** from Redis regardless of control of this middleware if the redis is configured to use some different evition policy.

### Expiration

On the other side, `EXPIRE` command **will not** always ensure a key is deleted due to the [probabilistic algorithm](http://redis.io/commands/expire) used by Redis. And this behavior cannot be alterd or configured.


### Key-Value

For performance concern, we only use the simple key-value storage of Redis, instead of the various data structures like hash, set.

By defualt, all the keys of cache entries are prefixed by `koa-cache`.


## Usage


```
var cache = require("koa-cache")({
  redis: {
    port: "your port",
    host: "your host",
    auth: "auth code"
  }
});


app.use(cache.middleware());

// cache all 20x response
router.get("/", cache.all(), function*() {
  this.body = "content!";
  
  // cache `this.body` using `req.url` as key
  // default expire: 30 seconds
});


router.get("/users/:user", cache.all(), function*() {
  //do render
  yield this.render("user", {});
  
  // after `this.body` is set
  yield this.cache(["users", this.params.user], this.user, 60);
});


var match = cache.match(function*() {
  // do some match
  if(this.request.body.uuid) {
    // return true to read from cache
    // using `this.req.url` as key
    retrun true;
  }
  return false;
});

router.get("/request", match, function*() {
  this.body = "some response";
});


router.update("/users/:user", function*() {
  // do some update
  update();
  // invalidate cache
  yield this.invalidate(["users", this.params.user]);
});

```