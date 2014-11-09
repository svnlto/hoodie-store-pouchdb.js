'use strict';

var hoodie = {
  id: function() {
    return 'hoodie123';
  },
  pouchAdapter: null,
  baseUrl: 'http://localhost',
  plugin: function(plugin) {
    plugin.call(this);
  }
};
