var url = require('url');
var httpreq = require('httpreq');

var blockList = {};

httpreq.get("http://pgl.yoyo.org/adservers/serverlist.php?&mimetype=plaintext",
            function (err, res) {
              var lines = res.body.split('\n');
              for (var i = 0; i < lines.length; i++)
              {
                if (lines[i].trim() == "")
                  continue;
                blockList[lines[i]] = true;
              }
            });

exports.handleRequest = function(request, response, options) {
  var requestedUrl = url.parse(request.headers.path || request.url);
  var host = requestedUrl.hostname;
  var rootHost = host.split('.').slice(-2).join('.');

  var t1 = process.hrtime()[1];
  var isAd = host in blockList || rootHost in blockList;
  var t2 = process.hrtime()[1];

  console.log("time:", (t2 - t1) / 1000000);
  if (isAd)
  {
    console.log('BLOCKED'.red, requestedUrl.href);
    response.writeHead(404);
    response.end();
    return true;
  }

  return false;
};
