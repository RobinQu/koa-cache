/*jshint esnext:true */

var koa = require("koa"),
    co = require("co"),
    expect = require("chai").expect,
    router = require("koa-router"),
    debug = require("debug")("testapp"),
    Cache = require("../lib/cache"),
    session = require("koa-session"),
    request = require("co-request");

var port = 9090;
var app = koa();
var cache = new Cache();


app.keys = ["secrets"];
app.use(session());
app.use(router(app));


app.get("/data", cache.all(), function*() {
  debug(this.req.url);
  this.body = "hello";
});
app.get("/private", cache.all(), function*() {
  var user = this.query.user;
  debug(this.req.url);
  this.cacheKey(user);
  this.body = "private:" + user;
});
app.get("/match", cache.match(function*() {
  //do some simple match
  if(this.session.user) {
    return this.session.user === this.cacheKey();
  }
  return true;
}), function*() {
  debug(this.req.url);
  var user = this.query.user;
  this.cacheKey(user);
  this.session.user = user;
  this.body = "match:" + user;
});


cache.bind(app);
// app.use(r.middleware());

app.listen(port);

module.exports = app;