var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var request = require('request');
var StreamListener = require('./StreamListener');
var StreamStats = require('./StreamStats')

var config = require('config');

app.use(express.static(path.join(__dirname, '../client')));


function fakeTweet() {
  return {
    id_str: new Date().getTime().toString(),
    retweeted_status: undefined
  };
}

var sockets = [];

var streamStats = new StreamStats();

setInterval(function() {
  var stats = streamStats.getStats();
  sockets.forEach(function(socket) {
    socket.emit('stats', stats);
  })
}, 1000);

if(config.realData) {
  StreamListener.start(function (tweet) {
    console.log(tweet);
    streamStats.addTweet(tweet);

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
} else {
  setInterval(function() {
    var tweet = fakeTweet();
    console.log(tweet);
    streamStats.addTweet(tweet);
    sockets.forEach(function (socket) {
      socket.emit('tweet', tweet);
    });
  }, 100)
}


io.on('connection', function (socket) {
  sockets.push(socket);
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});