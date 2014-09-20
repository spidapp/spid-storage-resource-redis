'use strict';

var RedisAssetStorage = require('../');
var Configuration     = require('./stub/Configuration');
var t                 = require('chai').assert;
var _                 = require('lodash');

var redisConfig = {
  port     : parseInt(process.env.REDIS_PORT, 10),
  host     : process.env.REDIS_HOST,
  password : process.env.REDIS_PASSWORD
};

var KEY = 'key';
var VALUE = 'value';

describe('RedisAssetStorage', function () {
  var storage, configuration;

  beforeEach(function (done) {
    storage       = new RedisAssetStorage();
    configuration = Configuration.get();
    done();
  });

  it('default configuration should be available', function (f) {
    storage.init(configuration, _.noop);

    t.strictEqual(configuration.test.params.port, 6379);
    t.strictEqual(configuration.test.params.host, '127.0.0.1');
    t.strictEqual(configuration.test.params.password, null);

    f();
  });

  it('should connect to redis', function (f) {
    storage.init(configuration, function(err){
      t.equal(err, void 0);
      storage.dispose(f);
    });

    configuration.test.f(null, redisConfig);
  });

  describe('once connected', function () {
    beforeEach(function (f) {
      // init config
      storage.init(configuration, function (){
        storage._client.flushdb(function(){
          f();
        });
      });
      configuration.test.f(null, redisConfig);
    });

    describe('.write', function () {
      it('should be able to write to storage', function (f) {
        storage.write(KEY, VALUE, function(err, value){
          t.strictEqual(err, null);
          f();
        });
      });
    });

    describe('.read', function () {
      it('should be able to read non-existent key', function (f) {
        storage.read(KEY, function(err, value){
          t.strictEqual(err, null);
          t.strictEqual(value, null);
          f();
        });
      });

      it('should be able to read key', function (f) {
        storage.write(KEY, VALUE, function(err, value){
          storage.read(KEY, function(err, value){
            t.strictEqual(value, VALUE);
            f();
          });
        });
      });
    });

    afterEach(function (f) {
      storage.dispose(f);
    });
  });
});
