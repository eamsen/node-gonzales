var cache = {};

exports.handleRequest = function(request, response) {
  var cacheObj = cache[request.url];

  if (!cacheObj) {
    request.log('cache miss');
    return false;
  }

  request.log('cache hit!');

  response.writeHead(cacheObj.statusCode, '', cacheObj.headers);
  response.write(cacheObj.data, function() {
    response.end();
  });

  return true;
};

exports.handleResponse = function(request, source, dest) {
  var cacheObj = {
    statusCode: source.statusCode,
    headers: source.headers,
  };

  dest.writeHead(source.statusCode, '', source.headers);

  var bufs = [];
  source.on('data', function(b) {
    bufs.push(b);
    dest.write(b);
  });

  source.on('end', function() {
    cacheObj.data = Buffer.concat(bufs);
    cache[request.url] = cacheObj;

    dest.end();
  });

  source.resume();
};
