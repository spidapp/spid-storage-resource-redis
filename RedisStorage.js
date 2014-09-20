'use strict';

var redis            = require('redis');
var StorageInterface = require('spid-storage-interface');

function RedisStorage() {
  this._client = null;
}

/**
 * [init description]
 * @param  {Function} f(err)
 */
RedisStorage.prototype.init = function (f) {
  // TODO: get redis configuration from config

  try {
    this._client = redis.createClient(6379, '127.0.0.1', {
      max_attempts: 1
    });

    this._client.once('ready', f);
    this._client.once('error', f);
  }
  catch (e) {
    f(e);
  }
};

/**
 * [dispose description]
 * @param  {Function} f(err)
 */
RedisStorage.prototype.dispose = function (f) {
  if (this._client.connected) {
    this._client.quit();
    f();
    return;
  }

  f(new Error(RedisStorage.name + ' was not connected'));
};

/**
 * [read description]
 * @param  {[type]} key  [description]
 * @param  {[type]} value [description]
 * @param  {Function} f(err, value)
 * @return {[type]}       [description]
 */
RedisStorage.prototype.read = function (key, f) {
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
 * @return {[type]}       [description]
 */
RedisStorage.prototype.write = function (key, value, f) {
  // @todo handle errors
  this._client.set(key, value, function (err) {f();});
};

module.exports = StorageInterface.ensureImplements(RedisStorage);
