var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var StreamListener = require('./StreamListener');

app.use(express.static(path.join(__dirname, '../client')));


var sockets = [];

StreamListener.start(function (tweet) {
  sockets.forEach(function (socket) {
    socket.emit('tweet', tweet);
  });
});

io.on('connection', function (socket) {
  sockets.push(socket);
});

server.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});