var hoodie = {
  id: function() { return 'hoodie123' },
  baseUrl: 'http://localhost',
  plugin: function(plugin) {
    plugin.call(this);
  }
}
