
function TweetParticle(tweet, sprite) {
  this.tweet = tweet;
  this.sprite = sprite;

  var radiusRange = 100;
  sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  sprite.position.setLength( radiusRange * (Math.random() * 0.1 + 0.9) );
  sprite.material.color.setHSL( Math.random(), 0.9, 0.7 );

  this.age = 0;
  this.maxAge = 6;
}

TweetParticle.prototype.update = function(dt) {
  this.age += dt;

  if (this.age >= this.maxAge) {
    this.sprite.visible = false;
  }
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
  var sprite = this.particlesPool.pop();
  sprite.visible = true;
  return sprite;
}

TweetConstelation.prototype.addTweet = function(tweet) {
  var sprite = this.getFreeParticle();
  this.tweets.push(new TweetParticle(tweet, sprite));
}

TweetConstelation.prototype.initialize = function() {
  this.initParticlesPool();
  this.tweets = [];
}

TweetConstelation.prototype.update = function(dt) {
  this.particleGroup.rotation.y += dt * 0.75;
  this.tweets.forEach(function (tweetParticle) {
    tweetParticle.update(dt);
  });
};