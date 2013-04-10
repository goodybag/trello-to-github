var http = require('http');
var https = require('https');
var config = require('./config.json');

function getToken(code, res) {
  if (typeof code != 'string') {
    res.writeHead(400, 'Must supply code');
    res.end();
    return;
  }

  var ghreq = https.request({
    hostname:'github.com',
    path:'/login/oauth/access_token',
    method:'POST',
    headers:{
      "Content-Type":"application/json",
      "Accept":"application/json"
    }
  }, function(ghres){
    var data = '';

    if (ghres.statusCode === 404) {
      res.writeHead(500);
      res.end();
      return;
    }

    ghres.on('data', function(chunk){data += chunk;});
    ghres.on('end', function() {
      var body = JSON.parse(data);
      if (body['error'] != null)
        res.writeHead(400, body['error']);
      else
        res.writeHead(200);

      res.write(data);
      res.end();
    });
  });

  var data = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    code:code
  };

  ghreq.write(JSON.stringify(data));
  ghreq.end();
}

var server = http.createServer(function (req, res) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Accept', 'application/json');
  var data = '';

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  var lcHeaders = {};
  for (k in req.headers)
    lcHeaders[k.toLowerCase()] = req.headers[k];

  if (lcHeaders['content-type'] !== 'application/json') {
    res.writeHead(415, 'Content-Type must be application/json');
    res.end();
    return;
  }

  //TODO: check req accept header

  req.on('data', function(chunk) {data += chunk;});
  req.on('end', function(){
    var body = data != '' ? JSON.parse(data) : undefined;
    getToken(body['code'], res);
  });
});

exports.start = function(port) {
  server.listen(port);
  console.log('running on port ' + port);
}

exports.start(8000);
