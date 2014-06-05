var util = require('util');
var PipedResponse = require('./pluginUtil').PipedResponse;

var PassthroughPlugin = require('./passthrough');
var GzipPlugin = require('./gzip');
var GunzipPlugin = require('./gunzip');
//var PlaceholderImagePlugin = require('./placeholderImage');
var GIF2VideoPlugin = require('./dom/gif2video');
var DumbCache = require('./dumbcache');
var DeliverPlugin = require('./deliver');

var DOMPlugins = require('./dom');

var plugins = {
  request: [DumbCache, GIF2VideoPlugin],
  response: [PassthroughPlugin, GunzipPlugin, GIF2VideoPlugin, DOMPlugins,
  GzipPlugin, DeliverPlugin, DumbCache]
};

exports.handleRequest = function(request, response, options) {
  return plugins.request.some(function(plugin) {
    return plugin.handleRequest(request, response, options);
  });
};

exports.handleResponse = function(request, source, dest, options) {
  var currentSource = source;
  var currentDest = null;
  plugins.response.forEach(function(plugin, i) {
    currentDest = i === plugins.response.length - 1 ?
                  dest :
                  new PipedResponse(currentSource);
    plugin.handleResponse(request, currentSource, currentDest, options);
    currentSource = currentDest;
  });
};