var fs = require('fs');
var temp = require ('temp')
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var mozjpeg = require('mozjpeg').path;
var pngquant = require('pngquant-bin').path;
var imgtype = require('imagetype');

exports.handleResponse = function(request, source, dest, options) {

  // If this is an image we first write it into a file, then optimize it
  // and send it
  if (source.headers['content-type'] == 'image/jpeg'
      || source.headers['content-type'] == 'image/png')
  {
    var path = temp.path();
    var optPath = path + '.opt';
    var imageFile = fs.createWriteStream(path);

    source.on('data', function (chunk) {
      imageFile.write(chunk);
    });

    source.on('end', function () {
      imageFile.end(null, null, function () {

        // We need to check the actual type of the downloaded image.
        // Some websites (e.g. mozilla.org) are sending JPEGs as PNGs.
        try {
        var type = imgtype(path);
        } catch (err) {
          console.log("type error:", path, request.headers.path);
          throw err;
        }

        function sendImage(path)
        {
          dest.headers['content-length'] = fs.statSync(path).size.toString();

          try {
          imageFile = fs.createReadStream(path);
          } catch (err) {
            console.log("error");
            throw err;
          }
          imageFile.pipe(dest);

          dest.on('end', function () {
            fs.unlink(path);
          });
        }

        if (type == "png")
        {
          execFile(pngquant, ['--skip-if-larger', '-o', optPath, path], function (err) {
            if (err)
              sendImage(path);
            else
            {
              sendImage(optPath);
              fs.unlink(path);
            }
          });
        }
        else if (type == "jpeg")
        {
          execFile(mozjpeg, ['-outfile', optPath, path], function (err, stdout, stderr) {
            if (err)
              sendImage(path);
            else
            {
              sendImage(optPath);
              fs.unlink(path);
            }
          });
        }
        else
        {
          sendImage(path);
        }
      });
    });
  }
  else
  {
    source.pipe(dest);
  }

  source.resume();
}
