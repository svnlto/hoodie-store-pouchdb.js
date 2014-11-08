/* global require, describe, afterEach, it, global */
'use strict';

var expect = require('expect.js');
var MemDOWN = require('memdown');

global.Promise = require('bluebird');
global.hoodie = {
  id: function() {
    return 'hoodie123';
  },
  baseUrl: 'http://localhost',
  pouchAdapter: {
    db : MemDOWN
  },
  plugin: function(plugin) {
    plugin.call(this);
  }
};
require('../src/hoodie-store-pouchdb');

var store = global.hoodie.store;

describe('hoodie-store-pouchdb', function () {

  // clear data after each test
  afterEach(function(done) {
    MemDOWN.destroy('hoodie-store', function() {
      new MemDOWN('hoodie-store');
      done();
    });
  });

  describe('local db interactions', function () {
    it('store.add with valid object', function (done) {
      store.add({
        foo: 'bar'
      })
      .then(function (object) {
        expect(object.foo).to.eql('bar');
        done();
      }, done);
    });

    it('store.add with object.id', function (done) {
      store.add({
        id: 'thing'
      })
      .then(function (object) {
        expect(object.id).to.eql('thing');
        expect(object._id).to.be(undefined);
        done();
      }, done);
    });

    it('store.add with invalid object', function (done) {
      store.add()
      .catch(function (error) {
        expect(error.message).to.be.ok();
        done();
      });
    });

    it('store.find with existing object', function (done) {
      store.add({
        id: 'exists'
      }).then(function () {
        store.find('exists')
        .then(function (object) {
          expect(object.id).to.eql('exists');
          done();
        }, done);
      });
    });

    it('store.find without existing object', function (done) {
      store.find('thing')
      .catch(function (error) {
        expect(error.message).to.be('missing');
        done();
      });
    });
    it('store.find(object)', function (done) {
      store.add({
        id: 'exists'
      }).then(function () {
        store.find({id: 'exists'})
        .then(function (object) {
          expect(object.id).to.eql('exists');
          done();
        }, done);
      });
    });

    describe('store.findOrAdd', function () {

      it('find', function (done) {
        store.add({
          id: 'exists'
        }).then(function () {
          return store.findOrAdd('exists', {foo: 'bar'})
          .then(function (object) {
            expect(object.id).to.eql('exists');
            expect(object.foo).to.be(undefined);
            done();
          });
        }).catch(done);
      });

      it('add', function (done) {
        store.findOrAdd('thing', {foo: 'bar'})
        .then(function (object) {
          expect(object.id).to.be('thing');
          expect(object.foo).to.be('bar');
          done();
        });
      });

      it('add without document', function (done) {
        store.findOrAdd('thing')
        .catch(function (error) {
          expect(error.message).to.be('Invalid object');
          done();
        });
      });
    });

    it('store.findAll', function (done) {
      store.add({
        id: 'exists'
      }).then(function () {
        store.findAll()
        .then(function (objects) {
          expect(objects).to.be.an('array');
          expect(objects.length).to.eql(1);
          expect(objects[0].id).to.be('exists');
          done();
        }, done);
      });
    });

    it('store.update with object', function (done) {
      store.add({
        id: 'exists'
      }).then(function () {
        store.update('exists', {
          foo: 'bar'
        })
        .then(function (object) {
          expect(object.id).to.be('exists');
          expect(parseInt(object._rev)).to.be(2);
          expect(object.foo).to.be('bar');
          done();
        });
      });
    });

    it('store.update without object', function (done) {
      store.update('nothinghere')
      .catch(function (error) {
        expect(error.message).to.eql('Invalid change');
        done();
      });
    });

    describe('store.updateOrAdd', function () {
      it('update', function (done) {
        store.add({
          id: 'exists'
        }).then(function () {
          store.updateOrAdd('exists', {foo: 'bar'})
          .then(function (object) {
            expect(parseInt(object._rev)).to.eql(2);
            expect(object.foo).to.eql('bar');
            done();
          });
        });
      });

      it('add', function (done) {
        store.findOrAdd('thing', {foo: 'bar'})
        .then(function (document) {
          expect(parseInt(document._rev, 10)).to.eql(1);
          expect(document.foo).to.eql('bar');
          done();
        });
      });
    });

    it('store.updateAll with objects', function (done) {
      store.add({
        id: 'exists'
      }).then(function () {
        store.updateAll({
          foo: 'bar'
        })
        .then(function (objects) {
          expect(objects).to.be.an('array');
          expect(objects.length).to.eql(1);
          expect(objects[0].id).to.be('exists');
          expect(objects[0].foo).to.be('bar');
          done();
        });
      });
    });

    it('store.updateAll without objects', function (done) {
      store.updateAll({
        foo: 'bar'
      })
      .then(function (objects) {
        expect(objects).to.be.an('array');
        expect(objects.length).to.eql(0);
        done();
      });
    });

    it('store.remove with object', function (done) {
      store.add({
        id: 'exists',
        foo: 'bar'
      }).then(function (response) {
        store.remove('exists')
        .then(function (object) {
          expect(object.foo).to.be('bar');
          done();
        });
      });
    });

    it('store.remove without object', function (done) {
      store.remove('exists')
      .catch(function (error) {
        expect(error.message).to.be('missing');
        done();
      });
    });

    it('store.removeAll with objects', function (done) {
      store.add({
        id: 'exists',
        foo: 'bar'
      }).then(function () {
        store.removeAll()
        .then(function (objects) {
          expect(objects).to.be.an('array');
          expect(objects.length).to.eql(1);
          expect(objects[0].id).to.be('exists');
          expect(objects[0].foo).to.be('bar');
          done();
        });
      });
    });

    it('store.removeAll without objects', function (done) {
      store.removeAll()
      .then(function (objects) {
        expect(objects).to.be.an('array');
        expect(objects.length).to.eql(0);
        done();
      });
    });
  });
});
