
// Simply accumulates the data and writes the final result to dest. Here
// 'dest' should be the actual http response
exports.handleResponse = function(request, source, dest) {

  if (source.accumulate) {
    request.log('accumulating result');

    var bufs = [];
    source.on('data', function(b) {
      bufs.push(b);
    });

    source.on('end', function() {
      var finalBuffer = Buffer.concat(bufs);

      request.log('delivering %d bytes', finalBuffer.length);

      dest.statusCode = source.statusCode;
      dest.headers = source.headers;
      dest.headers['content-length'] = finalBuffer.length;

      dest.writeHead(source.statusCode, '', dest.headers);
      dest.write(finalBuffer);
      dest.end();
    });

  } else {
    request.log('NOT accumulating result');
    if (source.contentLengthChange) {
      request.log('stripping content-length');
      // We don't know how much we're going to send, so
      // strip any content-length header
      delete source.headers['content-length'];
    }

    dest.writeHead(source.statusCode, '', source.headers);

    var count = 0;
    source.on('data', function(b) {
      count += b.length;
      dest.write(b);
    });

    source.on('end', function() {
      request.log('delivered (streaming) %d bytes', count);
      dest.end();
    });
  }

  source.resume();
};
