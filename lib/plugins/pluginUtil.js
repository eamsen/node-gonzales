var util = require('util');
var Duplex = require('stream').Duplex;

exports.matchHeaders = function(headers, query) {
  var headerNames = Object.keys(query);
  for (var i = 0; i < headerNames.length; i++) {
    var headerName = headerNames[i];
    var queryVal = query[headerName];
    var headerVal = headers[headerName] || '';

    var truthyHeaderVal = Boolean(headerVal);
    if (typeof queryVal === 'boolean' &&
        truthyHeaderVal !== queryVal) {
      return false;
    }

    if (queryVal instanceof RegExp &&
        !headerVal.match(queryVal)) {
      return false;
    }

    if (typeof queryVal === 'string' &&
        headerVal !== queryVal) {
      return false;
    }
  }

  return true;
};

exports.PipedResponse = function(response, options) {
  this.statusCode = response.statusCode;
  this.headers = util._extend(response.headers, {});

  this._read = function() {
    // Chunks are immediately written to the read buffer
    // in _write, no work to do here
  };

  this.on('finish', function() {
    this.push(null);
  });

  this._write = function(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  };

  this.contentLengthChange = false;
  this.accumulate = false;

  Duplex.call(this, options);

  // Start off paused. Readers need to explicitly
  // resume to begin receiving events.
  this.pause();
};
util.inherits(exports.PipedResponse, Duplex);
