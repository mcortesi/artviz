
var DEBUG_ENABLED = false;

function debug() {
  'use strict';
  if (DEBUG_ENABLED) {
    console.log.apply(console, arguments);
  }
}

var TweetListener = {
  start: function (onTweet) {
    'use strict';

    var socket = io.connect('http://localhost:3000');
    socket.on('tweet', onTweet);
  }
};



function start() {
  'use strict';

  var scene = Scene.setup();

  TweetListener.start(function (newTweet) {
    scene.tweetConstellation.addTweet(newTweet);
  });

  scene.startAnimation();
}


start();


