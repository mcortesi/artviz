
function TweetParticle(tweet, sprite) {
  this._listeners = [];

  this.tweet = tweet;
  this.sprite = sprite;

  var radiusRange = 100;
  sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  sprite.position.setLength( radiusRange * (Math.random() * 0.1 + 0.9) );
  sprite.material.color.setHSL( Math.random(), 0.9, 0.7 );
  sprite.visible = true;

  this.age = 0;
  this.maxAge = 3;
}

TweetParticle.prototype.update = function(dt) {
  this.age += dt;

  if (this.age >= this.maxAge) {
    this.sprite.visible = false;
    this.trigger('expired');
  }
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
  this.maxTweets = 10 * 10;

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
    sprite.scale.set( 32, 32, 1.0 ); // imageWidth, imageHeight
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
    var tweetParticle = new TweetParticle(tweet, sprite)
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
  var self = this;

  this.particleGroup.rotation.y += dt * 0.75;

  for(var tweetId in this.tweetParticles) {
    this.tweetParticles[tweetId].update(dt);
  }

  this.cleanupExpiredParticleTweets();

};

TweetConstelation.prototype.cleanupExpiredParticleTweets = function() {
  var self = this;
  this._expiredTweetParticles.forEach(function(tweetParticle) {
    delete self.tweetParticles[tweetParticle.tweet.id];
    self.particlesPool.push(tweetParticle.sprite);
  });
  this._expiredTweetParticles = [];
}