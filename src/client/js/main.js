
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

var Parameters =  {
  MaxSupportedTPS: 100,
  textHue: 0.1,
  photoHue: 0.5,
  videoHue: 0.9,
  TweetLife: 6, //seconds
  SphereRadius: 600,
  PulseFactor: 1,
  RTAgeIncrease: 0.5,
  RotationSpeed: 0.5,
  explode: function() {alert("hola")}
};


window.onload = function() {
  'use strict';
  var gui = new dat.GUI();
  gui.remember(Parameters);

  gui.add(Parameters, 'textHue', 0, 1);
  gui.add(Parameters, 'photoHue', 0, 1);
  gui.add(Parameters, 'videoHue', 0, 1);
  gui.add(Parameters, 'TweetLife');
  gui.add(Parameters, 'SphereRadius');
  gui.add(Parameters, 'PulseFactor', 1, 10);
  gui.add(Parameters, 'RTAgeIncrease');
  gui.add(Parameters, 'RotationSpeed');
  gui.add(Parameters, 'explode');
};

start();


