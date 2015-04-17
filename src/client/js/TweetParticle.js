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

  var sizeScale = d3.scale.sqrt().domain([0, 10]).range([32*2, 32*4]);

  var TweenFactory = {
    onEnterTweet: function (sprite) {
      function updateSprite() {
        var imageSize = sizeScale(this.scale);
        sprite.material.opacity = this.opacity;
        sprite.scale.set(imageSize, imageSize, 1.0 ); // imageWidth, imageHeight
        sprite.material.needsUpdate = true;
      }

      return new TWEEN.Tween({opacity: 0, scale: 0})
        .to({opacity: 1, scale: 1 }, Parameters.ParticleEnterTime)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(updateSprite);
    },
    onLeaveTweet: function (sprite) {
      function updateSprite() {
        sprite.material.opacity = this.opacity;
        sprite.material.needsUpdate = true;
      }

      return new TWEEN.Tween({ opacity: sprite.material.opacity })
        .to({opacity: 0}, Parameters.ParticleLeaveTime)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(updateSprite);
    },
    onRetweet: function(sprite, retweetsCount) {
      var fromSize = sizeScale(retweetsCount -1);
      var toSize = sizeScale(retweetsCount);

      function updateSprite() {
        sprite.scale.set(this.imageSize, this.imageSize, 1.0 ); // imageWidth, imageHeight
      }

      return new TWEEN.Tween({imageSize: fromSize})
        .to({imageSize: toSize }, 0.5)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(updateSprite);
    },

    defaultTween: function(sprite) {
      var startPosition = sprite.position.clone();
      var randomness = Math.random() + 1;

      return {
        update: function (age) {
          var pulseFactor = Math.sin(randomness * Parameters.PulseFactor * age) * 0.1 + 0.9;
          sprite.position.x = startPosition.x * pulseFactor;
          sprite.position.y = startPosition.y * pulseFactor;
          sprite.position.z = startPosition.z * pulseFactor;
        }
      };
    }

  };

  function TweetParticle(tweet, sprite) {
    this._listeners = [];

    this.tweet = tweet;
    this.retweetCount = 0;
    this.sprite = sprite;

    sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
    sprite.position.setLength( Parameters.SphereRadius * (Math.random() * 0.1 + 0.9) );

    //this.setTexture(sprite);
    this.setSpriteColor(sprite);

    sprite.visible = true;

    this.age = 0;
    this.maxAge = Parameters.TweetLife;
    this.currentAction = TweenFactory.onEnterTweet(sprite).start(0);
    this.defaultTween = TweenFactory.defaultTween(sprite);
  }

  TweetParticle.prototype.setTexture = function(sprite) {
    var texture = Textures[this.tweet.contentType];
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
  };

  TweetParticle.prototype.setSpriteColor = function(sprite) {
    sprite.material.color.setHSL(Math.random(), 0.9, 0.8 );
  };

  TweetParticle.prototype.update = function(dt) {
    this.age += dt;

    this.currentAction.update(this.age);
    this.defaultTween.update(this.age);

    if (this.age >= this.maxAge - Parameters.ParticleLeaveTime && !this.dying) {
      this.dying = true;
      var sprite = this.sprite;
      this.currentAction.stop();
      this.currentAction = TweenFactory.onLeaveTweet(this.sprite)
        .onComplete(function () {
          sprite.visible = false;
        })
        .start(this.age);
    }
    return this.age >= this.maxAge;
  };

  TweetParticle.prototype.addRetweet = function(retweet) {
    this.retweetCount++;
    this.maxAge += Parameters.RTAgeIncrease;

    this.sprite.material.color.setHSL(Math.random(), 0.9, 0.8 )

    console.log('new retweet');
    if (this.dying) {
      console.log('dying stopped');
      this.currentAction.stop();
      this.currentAction = TweenFactory.onRetweet(this.sprite, this.retweetCount);
      this.dying = false;
    } else {
      this.currentAction.chain(TweenFactory.onRetweet(this.sprite, this.retweetCount));
    }
  };



  TweetParticle.prototype.toString = function() {
    return "{tweet: " + this.tweet.id + " , retweets: " + this.retweetCount + ",age: " + this.age + ", maxAge: " + this.maxAge + "}";
  };

  function TweetConstellation(scene) {
    this.maxTweets = Parameters.MaxSupportedTPS * Parameters.TweetLife;
    this.currentTweets = 0;
    //this.maxTweets = 2;
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
    this.particlesPool = {
      'text': [],
      'photo': [],
      'video': []
    };

    _.keys(this.particlesPool).forEach(function(contentType) {
      for (var i=0; i < this.maxTweets; i++) {
        var spriteMaterial = new THREE.SpriteMaterial( { map: Textures[contentType], useScreenCoordinates: false, color: 0xff0000, transparent: true, opacity: 0.5} );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.visible = false;

        this.particleGroup.add(sprite);
        this.particlesPool[contentType].push(sprite);
      }
    }, this);

    this.particleGroup.position.y = 100;
    this.scene.add(this.particleGroup);
  };

  TweetConstellation.prototype.allocParticle = function(parsedTweet) {
    var particle = null;

    if(this.currentTweets < this.maxTweets) {
      this.currentTweets++;
      particle = this.particlesPool[parsedTweet.contentType].pop();
    }

    return particle;
  };

  TweetConstellation.prototype.freeParticle = function(particle, parsedTweet) {
    this.particlesPool[parsedTweet.contentType].push(particle);
    this.currentTweets--;
  };

  TweetConstellation.prototype.addTweet = function(tweet) {
    var parsedTweet = this.parseTweet(tweet);

    if(!parsedTweet.is_retweet) {
      var sprite = this.allocParticle(parsedTweet);
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
  };

  TweetConstellation.prototype.initialize = function() {
    this.initParticlesPool();
    this.tweetParticles = {};
  };

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
      self.freeParticle(tweetParticle.sprite, tweetParticle.tweet);
    });
  };

  return TweetConstellation;
})();
