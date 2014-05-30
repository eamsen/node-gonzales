var pluginUtil = require('../pluginUtil');

var util = require('util');
var GIF2VideoPlugin = require('./gif2video');
var cheerio = require('cheerio');

var domPlugins = {
  options: [GIF2VideoPlugin],
  domResponse: [GIF2VideoPlugin]
};

var domPluginsOpts = {};
domPlugins.options.forEach(function(plugin) {
  domPluginsOpts = util._extend(plugin.options, domPluginsOpts);
});

exports.options = domPluginsOpts;

// Runs DOM manipulations
exports.handleResponse = function(request, source, dest, options) {
  if (pluginUtil.matchHeaders(source.headers, { 'content-type': /html/ })) {
    request.log('intercepting for DOM manipulation: ' +
      source.headers['content-type']);

    var docdata = '';
    source.on('data', function(buf) {
      docdata += buf.toString();
    });

    source.on('end', function() {
      var $ = cheerio.load(docdata);

      var i = 0;
      function nextPlugin() {
        if (i < domPlugins.domResponse.length) {
          domPlugins.domResponse[i++].handleDOMResponse(request, source, $,
                                                        nextPlugin, options);
        } else {
          request.log('flushing DOM');
          // No more DOM plugins, write out the new (presumably changed) DOM
          dest.write(new Buffer($.html()), function() {
            dest.end();
          });
        }
      }

      nextPlugin();
    });

    dest.contentLengthChange = true;
    dest.accumulate = true;
  } else {
    source.pipe(dest);
  }

  source.resume();
};
