var http = require('http');
var https = require('https');

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
      if (body['error'] != null) {
        res.writeHead(400, body['error']);
        res.end();
        return;
      }

      res.writeHead(200);
      res.write(JSON.stringify(body));
      res.end();
    });
  });

  var data = {
    client_id:'7e75915ed424adcab18a',
    client_secret:'7c15acf6686b5c574cad071967919bb2a17ef39a',
    code:code
  };

  ghreq.write(JSON.stringify(data));
  ghreq.end();
}

http.createServer(function (req, res) {
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
}).listen(80);

console.log('running on port 80');
