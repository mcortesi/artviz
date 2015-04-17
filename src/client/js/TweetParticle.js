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

  function createVideoGeometryPool(poolSize) {
    var pool = [];

    for (var i=0; i < poolSize; i++) {
      var material = new THREE.MeshPhongMaterial({
        color: 0xCC0000,
        transparent: true
      });
      var shape = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.IcosahedronGeometry( 40, 0 ), // radius, subdivisions
        [material] );
      shape.visible = false;
      pool.push(shape);
    }
    return pool;
  }

  function createTextGeometryPool(poolSize) {
    var pool = [];

    for (var i=0; i < poolSize; i++) {
      var material = new THREE.MeshPhongMaterial({
        color: 0xCC0000,
        transparent: true,
      });
      var shape = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.CubeGeometry(50, 50, 50, 1, 1, 1),
        [material] );
      shape.visible = false;
      pool.push(shape);
    }
    return pool;
  }

  function createImageGeometryPool(poolSize) {
    var pool = [];
    for (var i=0; i < poolSize; i++) {
      var material = new THREE.MeshPhongMaterial({
        color: 0xCC0000,
        transparent: true,
      });
      var shape = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.OctahedronGeometry( 50, 0 ),
        [material] );
      shape.visible = false;
      pool.push(shape);
    }
    return pool;
  }

  function createGeometryPool(poolSize) {
    return {
      text: createTextGeometryPool(poolSize / 3),
      photo: createImageGeometryPool(poolSize / 3),
      video: createVideoGeometryPool(poolSize / 3)
    };
  }

  var sizeScale = d3.scale.sqrt().domain([0, 10]).range([32*2, 32*4]);

  var TweenFactory = {
    onEnterTweet: function (shape) {
      return new TWEEN.Tween({opacity: 0, scale: 0})
        .to({opacity: 1, scale: 1 }, Parameters.ParticleEnterTime)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(function updateSprite() {
          var imageSize = sizeScale(this.scale);
          shape.children[0].material.opacity = this.opacity;
          //shape.scale.set(imageSize, imageSize, 1.0 ); // imageWidth, imageHeight
          shape.children[0].material.needsUpdate = true;
        });
    },
    onLeaveTweet: function (shape) {
      return new TWEEN.Tween({ opacity: shape.children[0].material.opacity })
        .to({opacity: 0}, Parameters.ParticleLeaveTime)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function updateSprite() {
          shape.children[0].material.opacity = this.opacity;
          shape.children[0].material.needsUpdate = true;
        });
    },
    onRetweet: function(shape, retweetsCount) {
      var fromSize = sizeScale(retweetsCount -1);
      var toSize = sizeScale(retweetsCount);

      return new TWEEN.Tween({imageSize: fromSize})
        .to({imageSize: toSize }, 0.5)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(function updateSprite() {
          //shape.scale.set(this.imageSize, this.imageSize, 1.0 ); // imageWidth, imageHeight
        });
    },

    defaultTween: function(shape) {
      var startPosition = shape.position.clone();
      var randomness = Math.random() + 1;

      return {
        update: function (age) {
          var pulseFactor = Math.sin(randomness * Parameters.PulseFactor * age) * 0.1 + 0.9;
          shape.position.x = startPosition.x * pulseFactor;
          shape.position.y = startPosition.y * pulseFactor;
          shape.position.z = startPosition.z * pulseFactor;
        }
      };
    }

  };

  function TweetParticle(tweet, shape) {
    this.tweet = tweet;
    this.shape = shape;
    this.age = 0;
    this.maxAge = Parameters.TweetLife;
    this.retweetCount = 0;

    shape.visible = true;
    shape.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
    shape.position.setLength( Parameters.SphereRadius * (Math.random() * 0.1 + 0.9) );

    //shape.material.map = Textures[this.tweet.contentType];

    shape.children[0].material.color.setHSL(Math.random(), 0.9, 0.8 );
    shape.children[0].material.needsUpdate = true;

    this.currentAction = TweenFactory.onEnterTweet(shape).onComplete(this._onTweenFinished.bind(this)).start(0);
    this.actionChain = [];
    this.defaultTween = TweenFactory.defaultTween(shape);
  }

  TweetParticle.prototype.update = function(dt) {
    this.age += dt;

    if (this.currentAction !== null) { this.currentAction.update(this.age) };
    this.defaultTween.update(this.age);

    if (this.age >= this.maxAge - Parameters.ParticleLeaveTime && !this.dying) {
      this.dying = true;
      var shape = this.shape;
      if (this.currentAction !== null) { this.currentAction.stop(); }
      this.currentAction = TweenFactory.onLeaveTweet(this.shape)
        .onComplete(function () {
          shape.visible = false;
        })
        .start(this.age);
    }
    return this.age >= this.maxAge;
  };

  TweetParticle.prototype._onTweenFinished = function() {
    var nextAction = null;
    if (this.actionChain.length > 0) {
      console.log('transition to NEXT action');
      nextAction = this.actionChain.shift();
      nextAction.start(this.age);
    }
    this.currentAction = nextAction;
  };

  TweetParticle.prototype.addRetweet = function(retweet) {
    this.retweetCount++;
    this.maxAge += Parameters.RTAgeIncrease;

    console.log('new retweet');
    var retweetTween = TweenFactory.onRetweet(this.shape, this.retweetCount)
      .onComplete(this._onTweenFinished.bind(this));
    if (this.dying) {
      console.log('dying stopped');
      this.currentAction.stop();
      this.currentAction = retweetTween.start(this.age);
      this.dying = false;
    } else if (this.currentAction === null) {
      this.currentAction = retweetTween;
    } else {
      this.actionChain.push(retweetTween);
    }
  };

  TweetParticle.prototype.toString = function() {
    return "{tweet: " + this.tweet.id + " , retweets: " + this.retweetCount + ",age: " + this.age + ", maxAge: " + this.maxAge + "}";
  };

  function TweetConstellation(scene) {
    this.maxTweets = Parameters.MaxSupportedTPS * Parameters.TweetLife;
    //this.maxTweets = 1;
    this.particleGroup = null;
    this.scene = scene;
  }

  TweetConstellation.prototype.initParticlesPool = function() {
    this.particlesPool = createGeometryPool(this.maxTweets);
    this.particleGroup = new THREE.Object3D();

    var addToPool = function (shape) {
      this.particleGroup.add(shape);
    }.bind(this);

    this.particlesPool.text.forEach(addToPool);
    this.particlesPool.photo.forEach(addToPool);
    this.particlesPool.video.forEach(addToPool);

    this.particleGroup.position.y = 100;
    this.scene.add(this.particleGroup);
  };

  TweetConstellation.prototype.getFreeParticle = function(tweetType) {
    return this.particlesPool[tweetType].pop();
  };

  TweetConstellation.prototype.addTweet = function(tweet) {
    var parsedTweet = this.parseTweet(tweet);

    if(!parsedTweet.is_retweet) {
      var shape = this.getFreeParticle(parsedTweet.contentType);
      if(shape) {
        this.tweetParticles[parsedTweet.id] = new TweetParticle(parsedTweet, shape);
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
      self.particlesPool[tweetParticle.tweet.contentType].push(tweetParticle.shape);
    });
  };

  return TweetConstellation;
})();
