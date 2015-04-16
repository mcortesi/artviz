var TweetConstellation = (function() {
  'use strict';

  function randInt(min,max){
    var range = max - min;
    // it actually does work the other way...
    // if (range < 0) { throw new RangeError("min must be less than max"); }

    var rand = Math.floor(Math.random() * (range + 1));
    return min + rand;
  }

  function parseAugmentedTweet(tweet) {
    return {
      id: tweet.id,
      contentType: getContentType(tweet),
      is_retweet: tweet.isRetweet,
      original_id: (tweet.isRetweet) ? tweet.original.id : null,
      retweeted_status: tweet.original,
      raw: tweet
    };
  }

  function parseRawTweet(tweet) {
    return {
      id: tweet.id_str,
      contentType: ['text', 'photo', 'video'][randInt(0, 2)],
      is_retweet: tweet.retweeted_status !== undefined,
      original_id: (tweet.retweeted_status !== undefined) ? tweet.retweeted_status.id_str : null,
      retweeted_status: tweet.retweeted_status,
      original: tweet
    };
  }

  function getContentType(tweet) {
      var contentType = 'text';

      if(tweet.hasVideos) {
        contentType = 'video';
      } else if(tweet.hasImages) {
        contentType = 'photo';
      }

      return contentType;
  }

  function TweetParticle(tweet, sprite) {
    this._listeners = [];

    this.tweet = tweet;
    this.retweetCount = 0;
    this.sprite = sprite;

    sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
    sprite.position.setLength( Parameters.SphereRadius * (Math.random() * 0.1 + 0.9) );

    this.startPosition = sprite.position.clone();
    this.randomness = Math.random();

    this.setTexture(sprite);
    this.setSpriteColor(sprite);
    this.computeScale();

    sprite.scale.set(this.scale, this.scale, 1.0 ); // imageWidth, imageHeight
    sprite.visible = true;

    this.age = 0;
    this.maxAge = Parameters.TweetLife;
    this.opacityTween = new TWEEN.Tween(sprite.material).to({ opacity: 0 }, 1).delay(Parameters.TweetLife - 1).start(0);
  }

  TweetParticle.prototype.setTexture = function(sprite) {
    var texture = Textures[this.tweet.contentType];
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
  };

  TweetParticle.prototype.setSpriteColor = function(sprite) {
    // var hueMap = {
    //   'text': Parameters.textHue,
    //   'photo': Parameters.photoHue,
    //   'video': Parameters.videoHue
    // };

    //var hue = hueMap[this.tweet.contentType];
    //hue = this.tweet.is_retweet? 0.5 : 0.9;

    sprite.material.opacity = Math.random(); // translucent particles color
    sprite.material.color.setHSL(Math.random(), 0.9, 0.8 );
  };

  TweetParticle.prototype.update = function(dt) {
    this.age += dt;

    this.sprite.scale.set(this.scale, this.scale, 1.0 ); // imageWidth, imageHeight
    this.opacityTween.update(this.age);
    this.sprite.material.needsUpdate = true;

    var a = this.randomness + 1;
    var pulseFactor = Math.sin(a * Parameters.PulseFactor * this.age) * 0.1 + 0.9;
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
    this.maxAge += Parameters.RTAgeIncrease;
    this.computeScale()

  };

  var sizeScale = d3.scale.sqrt().domain([0, 10]).range([32*2, 32*4])

  TweetParticle.prototype.computeScale = function() {
    this.scale = sizeScale(this.retweetCount);
  };

  TweetParticle.prototype.toString = function() {
    return "{tweet: " + this.tweet.id + " , retweets: " + this.retweetCount + ",age: " + this.age + ", maxAge: " + this.maxAge + "}";
  };

  function TweetConstellation(scene) {
    this.maxTweets = Parameters.MaxSupportedTPS * Parameters.TweetLife;

    this.particleGroup = null;
    this.scene = scene;
  }


  var Textures = {
    'text': THREE.ImageUtils.loadTexture( 'images/spark-01.svg' ),
    'photo': THREE.ImageUtils.loadTexture( 'images/spark-02.svg' ),
    'video': THREE.ImageUtils.loadTexture( 'images/spark-03.svg' )
  };

  TweetConstellation.prototype.initParticlesPool = function() {
    this.particleGroup = new THREE.Object3D();
    this.particlesPool = [];
    for (var i=0; i < this.maxTweets; i++) {
      var spriteMaterial = new THREE.SpriteMaterial( { map: Textures['null'], useScreenCoordinates: false, color: 0xff0000, transparent: true, opacity: 0.5} );
      var sprite = new THREE.Sprite( spriteMaterial );
      sprite.visible = false;

      this.particleGroup.add(sprite);
      this.particlesPool.push(sprite);
    }
    this.particleGroup.position.y = 100;
    this.scene.add(this.particleGroup);
  };

  TweetConstellation.prototype.getFreeParticle = function() {
    return this.particlesPool.pop();
  };

  TweetConstellation.prototype.addTweet = function(tweet) {
    var parsedTweet = this.parseTweet(tweet);

    if(!parsedTweet.is_retweet) {
      var sprite = this.getFreeParticle();
      if(sprite) {
        this.tweetParticles[parsedTweet.id] = new TweetParticle(parsedTweet, sprite);
      } else {
        debug('Particle Pool Exhausted');
      }
    } else if (this.tweetParticles[parsedTweet.original_id]) {
      this.tweetParticles[parsedTweet.original_id].addRetweet(parsedTweet);
    } else {
      this.addTweet(parsedTweet.retweeted_status);
    }
  };

  TweetConstellation.prototype.parseTweet = function(tweet) {
    var parse = ('isRetweet' in tweet)? parseAugmentedTweet : parseRawTweet;

    return parse(tweet);
  }

  TweetConstellation.prototype.initialize = function() {
    this.initParticlesPool();
    this.tweetParticles = {};
  }

  TweetConstellation.prototype.update = function(dt) {
    this.particleGroup.rotation.y += dt * Parameters.RotationSpeed;

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

  return TweetConstellation;
})();
