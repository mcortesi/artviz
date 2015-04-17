
var DEBUG_ENABLED = false;

function debug() {
  'use strict';
  if (DEBUG_ENABLED) {
    console.log.apply(console, arguments);
  }
}

var TweetListener = {
  start: function (onTweet, onStats) {
    'use strict';

    var socket = io.connect('http://localhost:3000');
    socket.on('tweet', onTweet);
    socket.on('stats', onStats);
  }
};

function start() {
  'use strict';

  var scene = Scene.setup();

  TweetListener.start(
    function (newTweet) {
      scene.tweetConstellation.addTweet(newTweet);
    },
    function(stats) {
      console.log('TPM: ' + stats.tpm + ' - ' + 'TPS: ' + stats.tps)
      scene.tweetConstellation.updateStreamStats(stats);
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
  PulseFactor: 4,
  RTAgeIncrease: 1,
  RotationSpeed: 0.5,
  ParticleEnterTime: 1,
  ParticleLeaveTime: 0.5,
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
  gui.add(Parameters, 'ParticleEnterTime', 0.2, 2);
  gui.add(Parameters, 'ParticleLeaveTime', 0.5, 2);
  gui.add(Parameters, 'explode');
};

start();


