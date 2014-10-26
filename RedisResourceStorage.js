'use strict';

var redis                 = require('redis');
var ResourceStorageInterface = require('spid-storage-resource-interface');
var _                     = require('lodash');

function RedisResourceStorage() {
  this._client = null;
}

/**
 * [init description]
 * @param  {Function} f(err)
 */
RedisResourceStorage.prototype.init = function (configuration, f) {

  configuration({
    /**
     * @type {Number} redis port number
     */
    port:6379,

    /**
     * @type {String} host name, default localhost
     */
    host:'127.0.0.1',

    /**
     * [password description]
     * @type {String} password
     */
    password:null
  }, _.partialRight(this.applyConfiguration.bind(this), f));
};

/**
 * Apply a configuration that can change at runtime
 * @param  {Null|Object} stale
 *                       old configuration if defined, `null` otherwise
 * @param  {Null|Object} fresh
 *                       new configuration if defined, `null` otherwise
 * @param {Function}     f(err)
 *
 */
RedisResourceStorage.prototype.applyConfiguration = function(stale, fresh, f){
  if(stale && this._client){
    this._client.quit();
  }

  if(fresh){
    f = _.once(f);

    try {
      this._client = redis.createClient(fresh.port, fresh.host, {
        max_attempts: 1,
        auth_pass: fresh.password
      });

      this._client.once('ready', f);
      this._client.once('error', _.compose(f, this.onRedisError.bind(this)));
    } catch (e) {
      f(e);
    }
    return;
  }

  // `fresh` was falsy, just call the callback
  f();
};

RedisResourceStorage.prototype.onRedisError = function(err){
  console.log(err);
  // what should we do in case of redis error ?
  // currently we only print it to the default logger
  return err;
};

/**
 * [dispose description]
 * @param  {Function} f(err)
 */
RedisResourceStorage.prototype.dispose = function (f) {
  if (this._client.connected) {
    this._client.quit();
    f();
    return;
  }

  f(new Error(RedisResourceStorage.name + ' was not connected'));
};

/**
 * [read description]
 * @param  {[type]} key  [description]
 * @param  {[type]} value [description]
 * @param  {Function} f(err, value)
 */
RedisResourceStorage.prototype.read = function (key, f) {
  this._client.get(key, function (err, reply) {
    if (err) {
      f(err);
      return;
    }

    f(null, reply);
  });
};

/**
 * [write description]
 * @param  {[type]} key  [description]
 * @param  {[type]} value [description]
 * @param  {Function} f(err)
 */
RedisResourceStorage.prototype.write = function (key, value, f) {
  this._client.set(key, value, f);
};

module.exports = ResourceStorageInterface.ensureImplements(RedisResourceStorage);
