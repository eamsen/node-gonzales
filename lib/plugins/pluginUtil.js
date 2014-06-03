

exports.matchHeaders = function (headers, query) {
  var headerNames = Object.keys(query);
  var i = 0;
  var headerName = null;
  var queryVal = null;
  var headerVal = null;
  var truthyHeaderVal = null;

  for (i = 0; i < headerNames.length; i++) {
    headerName = headerNames[i];
    queryVal = query[headerName];
    headerVal = headers[headerName] || '';

    truthyHeaderVal = !!headerVal;
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
