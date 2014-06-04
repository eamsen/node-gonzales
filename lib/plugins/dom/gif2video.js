var Url = require('url');
var fs = require('fs');
var temp = require('temp');
var util = require('util');
var spawn = require('child_process').spawn;

var pendingIntercepts = {};
var intercepts = {};

temp.track();

function transcodeGIF(request, source, callback) {
  request.time('downloadGIF');

  var gifPath = temp.path({ suffix: '.gif' });
  var gifStream = fs.createWriteStream(gifPath);

  source.pipe(gifStream);
  gifStream.on('finish', function() {
    request.timeEnd('downloadGIF');
    request.time('transcodeGIF');
    var destPath = temp.path({ suffix: '.webm' });
    var ffmpeg = spawn('ffmpeg',
        ['-i', gifPath, '-vcodec', 'libvpx', destPath]);
    ffmpeg.on('close', function(code) {
      request.timeEnd('transcodeGIF');
      if (code !== 0) {
        callback('Failed, exit code ' + code);
        return;
      }

      var videoSource = fs.createReadStream(destPath);

      var bufs = [];
      videoSource.on('data', function(b) {
        bufs.push(b);
      });
      videoSource.on('end', function() {
        callback(null, Buffer.concat(bufs));
      });
    });
  });
}

// Intercept GIF requests and serve transcoded to webm
exports.handleRequest = function(request) {
  var gifUrl = pendingIntercepts[request.url] || intercepts[request.url];
  if (gifUrl) {
    request.log('replacing %s with %s', request.url, gifUrl);

    // Replace the url with the intercepted version
    request.originalUrl = request.url;
    request.url = gifUrl;
  }
};

// Replace <img src="foo.gif"> with <video autoplay loop src="foo.gif">
exports.handleDOMResponse = function(request, source, $, callback) {
  $('img').each(function(i, el) {
    var src = $(el).attr('src');
    if (src && src.match(/\.gif$/i)) {
      var gifSrc = Url.resolve(request.url, src);
      var webmSrc = gifSrc.replace(/\.gif$/i, '.webm');

      request.log('adding to gif intercept list: ' + gifSrc);

      pendingIntercepts[webmSrc] = gifSrc;
      $(el).replaceWith(
        util.format('<video autoplay loop src="%s"></video>', webmSrc));
    }
  });

  callback();
};

exports.handleResponse = function(request, source, dest) {
  if (pendingIntercepts[request.originalUrl]) {
    request.log('intercepting for conversion to video');

    dest.contentLengthChange = true;
    dest.accumulate = false;
    transcodeGIF(request, source, function(err, buffer) {
      if (!err) {
        delete pendingIntercepts[request.originalUrl];
        intercepts[request.originalUrl] = buffer;

        dest.headers['content-type'] = 'video/webm';
        dest.write(buffer, function() {
          dest.end();
        });
      } else {
        dest.statusCode = 500;
        dest.end();
      }
    });
  } else if (intercepts[request.originalUrl]) {
    request.log('intercepting for conversion to video (cached)');

    dest.contentLengthChange = true;
    dest.accumulate = false;

    dest.headers['content-type'] = 'video/webm';
    dest.write(intercepts[request.url], function() {
      dest.end();
    });
  } else {
    // Do nothing
    source.pipe(dest);
  }

  source.resume();
};
