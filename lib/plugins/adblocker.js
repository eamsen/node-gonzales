var url = require('url');
var httpreq = require('httpreq');

var blockList = {};

httpreq.get('http://pgl.yoyo.org/adservers/serverlist.php?&mimetype=plaintext',
            function (err, res) {
              var lines = res.body.split('\n');
              for (var i = 0; i < lines.length; i++)
              {
                if (lines[i].trim() === '')
                {
                  continue;
                }
                blockList[lines[i]] = true;
              }
            });

exports.handleRequest = function(request, response) {
  var requestedUrl = url.parse(request.headers.path || request.url);
  var hosts = requestedUrl.hostname.split('.');

  for (var i = -hosts.length; i <= -2; i++)
  {
    var h = hosts.slice(i).join('.');

    if (h in blockList)
    {
      console.log('BLOCKED'.red, requestedUrl.href);
      response.writeHead(404);
      response.end();
      return true;
    }
  }

  return false;
};
