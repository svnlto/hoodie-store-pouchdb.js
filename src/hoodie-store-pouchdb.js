'use strict';

var extend = require('pouchdb-extend');
var PouchDB = require('pouchdb');

module.exports = global.hoodie.plugin(function() {
  var store = {};
  var localDBName = 'hoodie-store';

  // var remoteDBName = 'user/' + this.id();
  var remoteDBUrl = this.baseUrl + '/_api/user%2f' + this.id();
  var adapter = this.pouchAdapter || {};
  var db = new PouchDB(localDBName, adapter);
  var sync;

  // PRIVATE
  var internals = {
    resolve: function () {
      return new Promise(function (resolve) {
        resolve();
      });
    },
    resolveWith: function (what) {
      return new Promise(function (resolve) {
        resolve(what);
      });
    },
    rejectWith: function (what) {
      return new Promise(function (resolve, reject) {
        reject(new Error(what));
      });
    },
    mapObjectToCouchDbDoc: function (object) {
      var doc = extend({}, object, {_id: object.id});
      delete doc.id;
      return doc;
    },
    mapCouchDbDocToObject: function (doc) {
      var object = extend({}, doc, {id: doc._id});
      delete object._id;
      return object;
    }
  };

  /**
   * Starts continuous replication to remote database
   *
   * @returns promise
   */
  store.connect = function () {
    sync = db.sync(remoteDBUrl, {
      live: true
    });
    return internals.resolve();
  };

  /**
   * Stops continuous replication to remote database
   *
   * @returns promise
   */
  store.disconnect = function () {
    if (!sync) {
      return internals.resolve();
    }
    sync.cancel();
    return internals.resolve();
  };

  /**
   * removes local database without triggering
   * events on objects.
   *
   * @returns promise
   */
  store.clear = function () {
    return db.destroy();
  };

  /**
   *
   */
  store.add = function (object) {
    var doc;

    if (!object) {
      return internals.rejectWith('Invalid object');
    }

    doc = internals.mapObjectToCouchDbDoc(object);
    return db.post(doc)
    .then(function (doc) {
      return db.get(doc.id);
    }).then(internals.mapCouchDbDocToObject);
  };


  /**
   *
   */
  store.find = function (idOrObject) {
    var id = idOrObject.id ? idOrObject.id : idOrObject;
    return db.get(id).then(internals.mapCouchDbDocToObject);
  };

  /**
   *
   */
  store.findOrAdd = function (id, object) {
    return store.find(id)
    .catch(function() {
      if (! object) {
        return internals.rejectWith('Invalid object');
      }
      object.id = id;
      return store.add(object);
    });
  };

  /**
   *
   */
  store.findAll = function () {
    // this will return all docs currently in the db
    // maybe she should scope this using db.query and
    // a map function instead
    return db.allDocs({
      'include_docs': true
    }).then(function (result) {
      return result.rows.map(function (row) {
        return internals.mapCouchDbDocToObject(row.doc);
      });
    });
  };

  /**
   *
   */
  store.update = function (id, changedProperties) {
    if (!changedProperties) {
      return internals.rejectWith('Invalid change');
    }

    return store.find(id)
    .then(function(object) {
      extend(object, changedProperties);
      return db.put(internals.mapObjectToCouchDbDoc(object));
    })
    .then(store.find);
  };

  /**
   *
   */
  store.updateOrAdd = function (id, properties) {
    return store.find(id)
    .then(function (existingObject) {
      return store.update(existingObject.id, properties);
    })
    .catch(function (error) {
      if (error.message === 'missing' ) {
        properties.id = id;
        return store.add(properties);
      }
    });

  };

  /**
   *
   */
  store.updateAll = function (changedProperties) {
    var updatedObjects;
    return store.findAll()
    .then(function(objects) {
      var docs;
      updatedObjects = objects.map(function(object) {
        return extend(object, changedProperties);
      });
      docs = updatedObjects.map(function(object) {
        return internals.mapObjectToCouchDbDoc(object);
      });
      return db.bulkDocs(docs);
    })
    .then(function(response) {
      response.forEach(function(doc, i) {
        updatedObjects[i]._rev = doc.rev;
      });
      return updatedObjects;
    });
  };

  /**
   *
   */
  store.remove = function (id) {
    var existingObject;
    return store.find(id)
    .then(function(object) {
      existingObject = object;
      // we can't use store.update, as it depends on
      // store.find, which will fail after the doc
      // has been removed.
      return db.remove(object.id, object._rev);
    }).then(function(response) {
      existingObject._rev = response.rev;
      return existingObject;
    });
  };

  /**
   *
   */
  store.removeAll = function () {
    var updatedObjects;
    return store.findAll()
    .then(function(objects) {
      var docs;
      updatedObjects = objects;
      docs = objects.map(function(object) {
        var doc = internals.mapObjectToCouchDbDoc(object);
        doc._deleted = true;
        return doc;
      });
      return db.bulkDocs(docs);
    })
    .then(function(response) {
      response.forEach(function(doc, i) {
        updatedObjects[i]._rev = doc.rev;
      });
      return updatedObjects;
    });
  };

  this.store = store;
});

