var DEBUG_ENABLED = true;

function debug() {
  if (DEBUG_ENABLED) {
    console.log.apply(console, arguments);
  }
}

var Parameters =  {
  MaxSupportedTPS: 100,
  textHue: 0.1,
  photoHue: 0.5,
  videoHue: 0.9,
  TweetLife: 6, //seconds
  SphereRadius: 100,
  explode: function() {alert("hola")}
};


window.onload = function() {
  var gui = new dat.GUI();
  gui.remember(Parameters);

  gui.add(Parameters, 'textHue', 0, 1);
  gui.add(Parameters, 'photoHue', 0, 1);
  gui.add(Parameters, 'videoHue', 0, 1);
  gui.add(Parameters, 'TweetLife');
  gui.add(Parameters, 'SphereRadius');
  gui.add(Parameters, 'explode');


}


function randInt(min,max){
  var range = max - min;
  // it actually does work the other way...
  // if (range < 0) { throw new RangeError("min must be less than max"); }

  var rand = Math.floor(Math.random() * (range + 1));
  return min + rand;
}

function parseTweet(tweet) {
  return {
    id: tweet.id_str,
    contentType: ['text', 'photo', 'video'][randInt(0, 2)],
    is_retweet: tweet.retweeted_status !== undefined,
    original_id: (tweet.retweeted_status !== undefined) ? tweet.retweeted_status.id_str : null,
    retweeted_status: tweet.retweeted_status,
    original: tweet
  }
}

function TweetParticle(tweet, sprite) {
  this._listeners = [];

  this.tweet = tweet;
  this.retweetCount = 0;
  this.sprite = sprite;

  sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  sprite.position.setLength( Parameters.SphereRadius * (Math.random() * 0.1 + 0.9) );

  this.startPosition = sprite.position.clone()
  this.randomness = Math.random();

  this.setSpriteColor(sprite);
  this.computeScale();

  sprite.scale.set(this.scale, this.scale, 1.0 ); // imageWidth, imageHeight
  sprite.visible = true;

  this.age = 0;
  this.maxAge = Parameters.TweetLife;
}

TweetParticle.prototype.setSpriteColor = function(sprite) {
  var hueMap = {
    'text': Parameters.textHue,
    'photo': Parameters.photoHue,
    'video': Parameters.videoHue
  }

  var hue = hueMap[this.tweet.contentType];

  //hue = this.tweet.is_retweet? 0.5 : 0.9;

  //sprite.material.color.setHSL( Math.random(), 0.9, 0.7 );
  sprite.material.color.setHSL(hue, 0.9, 0.7 );
};

TweetParticle.prototype.update = function(dt) {
  this.age += dt;

  this.sprite.scale.set(this.scale, this.scale, 1.0 ); // imageWidth, imageHeight

  var a = this.randomness + 1;
  var pulseFactor = Math.sin(a * 4 * this.age) * 0.1 + 0.9;
  this.sprite.position.x = this.startPosition.x * pulseFactor;
  this.sprite.position.y = this.startPosition.y * pulseFactor;
  this.sprite.position.z = this.startPosition.z * pulseFactor;


  if (this.age >= this.maxAge) {
    this.sprite.visible = false;
  }
  return this.age >= this.maxAge;
};



TweetParticle.prototype.addRetweet = function(retweet) {
  this.retweetCount++;
  this.maxAge += 0.5;
  this.computeScale()

};

var sizeScale = d3.scale.sqrt().domain([0, 10]).range([32*2, 32*4])

TweetParticle.prototype.computeScale = function() {
  this.scale = sizeScale(this.retweetCount);
}

TweetParticle.prototype.toString = function() {
  return "{tweet: " + this.tweet.id + " , retweets: " + this.retweetCount + ",age: " + this.age + ", maxAge: " + this.maxAge + "}";
}

function TweetConstelation(scene) {
  this.maxTweets = Parameters.MaxSupportedTPS * Parameters.TweetLife;

  this.particleGroup = null;

  this.scene = scene;
}

TweetConstelation.prototype.initParticlesPool = function() {
  var particleTexture = THREE.ImageUtils.loadTexture( 'images/spark.png' );

  this.particleGroup = new THREE.Object3D();
  this.particlesPool = [];
  for (var i=0; i < this.maxTweets; i++) {
    var spriteMaterial = new THREE.SpriteMaterial( { map: particleTexture, useScreenCoordinates: false, color: 0xff0000 } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.visible = false;

    this.particleGroup.add(sprite);
    this.particlesPool.push(sprite);
  }
  this.particleGroup.position.y = 100;
  this.scene.add(this.particleGroup);
}

TweetConstelation.prototype.getFreeParticle = function() {
  return this.particlesPool.pop();
}

TweetConstelation.prototype.addTweet = function(tweet) {
  var tweet = parseTweet(tweet);

  if(!tweet.is_retweet) {
    var sprite = this.getFreeParticle();
    if(sprite) {
      this.tweetParticles[tweet.id] = new TweetParticle(tweet, sprite);
    } else {
      console.log('Particle Pool Exhausted');
    }
  } else if (this.tweetParticles[tweet.original_id]) {
    this.tweetParticles[tweet.original_id].addRetweet(tweet);
  } else {
    this.addTweet(tweet.retweeted_status)
  }
};

TweetConstelation.prototype.initialize = function() {
  this.initParticlesPool();
  this.tweetParticles = {};
}

TweetConstelation.prototype.update = function(dt) {
  this.particleGroup.rotation.y += dt * 0.75;

  var deadTweetIds = _(this.tweetParticles)
    .mapValues(function (tweetParticle) { return tweetParticle.update(dt); })
    .pick(function (isDead, key) { return isDead; })
    .keys()
    .value();

  var self = this;
  if (deadTweetIds.length > 0) {
    debug('tweets to delete:', deadTweetIds.map(function(tid) { return self.tweetParticles[tid].toString() }));
  }

  deadTweetIds.forEach(function (tweetId) {
    var tweetParticle = self.tweetParticles[tweetId];
    delete self.tweetParticles[tweetId];
    self.particlesPool.push(tweetParticle.sprite);
  });
};