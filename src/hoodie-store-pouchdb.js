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
      var document = extend({}, object, {_id: object.id});
      delete document.id;
      return document;
    },
    mapCouchDbDocToObject: function (document) {
      var object = extend({}, document, {id: document._id});
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
    var document;

    if (!object) {
      return internals.rejectWith('Invalid object');
    }

    document = internals.mapObjectToCouchDbDoc(object);
    return db.post(document)
    .then(function (document) {
      return db.get(document.id);
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
    // this will return all documents currently in the db
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
      var documents;
      updatedObjects = objects.map(function(object) {
        return extend(object, changedProperties);
      });
      documents = updatedObjects.map(function(object) {
        return internals.mapObjectToCouchDbDoc(object);
      });
      return db.bulkDocs(documents);
    })
    .then(function(response) {
      response.forEach(function(document, i) {
        updatedObjects[i]._rev = document.rev;
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
      // store.find, which will fail after the document
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
      var documents;
      updatedObjects = objects;
      documents = objects.map(function(object) {
        var document = internals.mapObjectToCouchDbDoc(object);
        document._deleted = true;
        return document;
      });
      return db.bulkDocs(documents);
    })
    .then(function(response) {
      response.forEach(function(document, i) {
        updatedObjects[i]._rev = document.rev;
      });
      return updatedObjects;
    });
  };

  this.store = store;
});
