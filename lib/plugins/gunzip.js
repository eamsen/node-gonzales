var pluginUtil = require('./pluginUtil');
var zlib = require('zlib');

// gunzips a stream, if necessary
exports.handleResponse = function(request, source, dest) {
  if (pluginUtil.matchHeaders(source.headers, { 'content-encoding': /gzip/ })) {
    request.log('uncompressing with gunzip');
    delete dest.headers['content-encoding'];
    source.pipe(zlib.createGunzip()).pipe(dest);
  } else {
    // Do nothing
    source.pipe(dest);
  }

  source.resume();
};
