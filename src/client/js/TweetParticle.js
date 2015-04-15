function randInt(min,max){
  var range = max - min;
  // it actually does work the other way...
  // if (range < 0) { throw new RangeError("min must be less than max"); }

  var rand = Math.floor(Math.random() * (range + 1));
  return min + rand;
}

function parseTweet(tweet) {
  return {
    id: tweet.id,
    contentType: ['text', 'photo', 'video'][randInt(0, 2)],
    original: tweet
  }
}

function TweetParticle(tweet, sprite) {
  this._listeners = [];

  this.tweet = tweet;
  this.sprite = sprite;

  var radiusRange = 100;
  sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  sprite.position.setLength( radiusRange * (Math.random() * 0.1 + 0.9) );

  this.startPosition = sprite.position.clone()
  this.randomness = Math.random();

  this.setSpriteColor(sprite);
  sprite.visible = true;

  this.age = 0;
  this.maxAge = 2;
}

TweetParticle.prototype.setSpriteColor = function(sprite) {
  var hueMap = {
    'text': 0.1,
    'photo': 0.5,
    'video': 0.9
  }

  var hue = hueMap[this.tweet.contentType];

  //sprite.material.color.setHSL( Math.random(), 0.9, 0.7 );
  sprite.material.color.setHSL(hue, 0.9, 0.7 );
};

TweetParticle.prototype.update = function(dt) {
  this.age += dt;

  if (this.age >= this.maxAge) {
    this.sprite.visible = false;
    this.trigger('expired');
  }

  var time = clock.getElapsedTime(); // TODO remove this.
  var a = this.randomness + 1;
  var pulseFactor = Math.sin(a * 4 * time) * 0.1 + 0.9;
  this.sprite.position.x = this.startPosition.x * pulseFactor;
  this.sprite.position.y = this.startPosition.y * pulseFactor;
  this.sprite.position.z = this.startPosition.z * pulseFactor;
};

TweetParticle.prototype.addListener = function(listener) {
  this._listeners.push(listener);
};

TweetParticle.prototype.trigger = function(eventName) {
  var self = this;
  this._listeners.forEach(function(cb) {
    cb(eventName, self);
  })
};

function TweetConstelation(scene) {
  this.maxTweets = 100;

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
    sprite.scale.set( 32*2, 32*2, 1.0 ); // imageWidth, imageHeight
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
  var sprite = this.getFreeParticle();
  if(sprite) {
    var tweetParticle = new TweetParticle(parseTweet(tweet), sprite)
    tweetParticle.addListener(this.onExpiredTweetParticle.bind(this));
    this.tweetParticles[tweet.id] = tweetParticle;
  } else {
    console.log('Particle Pool Exhausted');
  }
};

TweetConstelation.prototype.onExpiredTweetParticle = function(eventName, tweetParticle) {
  if(eventName = 'expired') {
    console.log('Tweet Expired');
    this._expiredTweetParticles.push(tweetParticle);
  }
};

TweetConstelation.prototype.initialize = function() {
  this.initParticlesPool();
  this.tweetParticles = {};
  this._expiredTweetParticles = [];
}

TweetConstelation.prototype.update = function(dt) {
  this.particleGroup.rotation.y += dt * 0.75;

  _.forEach(this.tweetParticles, function(tweetParticle) {
    tweetParticle.update(dt);
  });

  this.cleanupExpiredParticleTweets();
};

TweetConstelation.prototype.cleanupExpiredParticleTweets = function() {
  var self = this;
  if (this._expiredTweetParticles.length > 0) {

    this._expiredTweetParticles.forEach(function(tweetParticle) {
      delete self.tweetParticles[tweetParticle.tweet.id];
      self.particlesPool.push(tweetParticle.sprite);
    });
    this._expiredTweetParticles = [];
  }
}