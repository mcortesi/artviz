
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

var AudioAnalyser = (function createAudioAnalyser() {
  var audio = document.getElementById('myAudio');
  audio.loop = true;

  var audioCtx = new AudioContext();
  var analyser = audioCtx.createAnalyser();
  var source =  audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 64;

  // frequencyBinCount tells you how many values you'll receive from the analyser
  var frequencyData = new Uint8Array(analyser.frequencyBinCount);

  return {
    audio: audio,
    analyser: analyser,
    frequencyData: frequencyData,
    paused: true,
    pulseScale : d3.scale.sqrt().domain([2000, 6000]).range([0.1, 1.5]),

    populateFrequencyData: function() {
      this.analyser.getByteFrequencyData(this.frequencyData);
    },

    getFrequencySum: function() {
      this.populateFrequencyData();
      var sum = 0;
      for(var i = 0; i < this.frequencyData.length; i++) {
        sum += this.frequencyData[i];
      }

      return sum;
    },
    start: function() {
      this.paused = false;
      audio.play();
    },
    getPulse: function() {
      if(this.paused) {
        return 0.1;
      } else {
        return this.pulseScale(this.getFrequencySum());
      }
    },
    pause: function() {
      this.paused = true;
      audio.pause();
    },
    toggle: function() {
      if(this.paused) {
        this.start();
      } else {
        this.pause();
      }
    }

  }

})();

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
  SphereRadius: 3000,
  PulseFactor: 3,
  RTAgeIncrease: 1,
  RotationSpeed: 0.5,
  ParticleEnterTime: 1,
  ParticleLeaveTime: 0.5,
  ToggleMusic: function() { AudioAnalyser.toggle();}
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
  gui.add(Parameters, 'ToggleMusic');

  start();
};




