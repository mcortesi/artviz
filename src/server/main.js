var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var request = require('request');
var StreamListener = require('./StreamListener');
var config = require('config');

app.use(express.static(path.join(__dirname, '../client')));


var sockets = [];

StreamListener.start(function (tweet) {
  if(!config.augment) {
    sockets.forEach(function (socket) {
      socket.emit('tweet', tweet);
    });
  } else {
    var options = {
      url: config.augmentUrl,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: tweet,
      json: true
    };

    request.post(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        sockets.forEach(function (socket) {
          socket.emit('tweet', body);
        });
      } else {
        console.log(error);
        console.log(response);
      }
    })
  }


});

io.on('connection', function (socket) {
  sockets.push(socket);
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});