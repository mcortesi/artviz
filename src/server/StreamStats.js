'use strict';



function StreamStats() {
  this.tpmBuckets = [];
  for(var i = 0; i < 60; i++) {
    this.tpmBuckets.push(0);
  }

  this.tpsBuckets = [];
  for(var i = 0; i < 10; i++) {
    this.tpsBuckets.push(0);
  }

  setInterval(function() {
    this.tpmBuckets[(new Date().getSeconds() + 1) % 60] = 0;
  }.bind(this), 1000);

  setInterval(function() {
    this.tpsBuckets[((new Date().getMilliseconds() / 100) + 1) % 10] = 0;
  }.bind(this), 100);

}

StreamStats.prototype.addTweet = function(tweet) {
  this.tpmBuckets[new Date().getSeconds()]++;
  this.tpsBuckets[new Date().getMilliseconds() / 100]++;
};

StreamStats.prototype.getStats = function() {
  return {
    'tps': this.tpsBuckets.reduce(function(prev, curr) {return prev + curr}, 0),
    'tpm': this.tpmBuckets.reduce(function(prev, curr) {return prev + curr}, 0)
  }
};

module.exports = StreamStats