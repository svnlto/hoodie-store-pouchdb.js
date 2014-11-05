/**
 *
 *
 */
hoodie.plugin(function () {
  var storeApi = {};
  var localDbName = 'hoodie-store';

  var remoteDbName = 'user/' + this.id();
  var remoteDbUrl = this.baseUrl + '/_api/user%2f' + this.id();
  var db = new PouchDB(localDbName);
  var sync;

  /**
   * Starts continuous replication to remote database
   *
   * @returns promise
   */
  storeApi.connect = function() {
    sync = db.sync(remoteDbUrl, {live: true});

    return /* promise */;
  }

  /**
   * Stops continuous replication to remote database
   *
   * @returns promise
   */
  storeApi.disconnect = function() {
    if (sync) {
      sync.cancel();
    }

    return /* promise */;
  }

  /**
   * removes local database without triggering
   * events on objects.
   *
   * @returns promise
   */
  storeApi.clear = function() {
    return db.destroy();
  }

  this.store = storeApi;
});
