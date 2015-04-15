'use strict';

var Twit = require('twit');

var credentials = require('./twitter-credentials.json');
var twit = new Twit(credentials);

function start(onTweet) {
  var stream = twit.stream('statuses/filter', {
    track: ['#love', '#hate']
  })

  stream.on('tweet', function (tweet) {
    onTweet(tweet);
  });

  stream.on('connect', function (request) {
    console.log('we are now Connected to the twitter stream');
  });

  stream.on('disconnect', function (disconnectMessage) {
    console.log('stream disconnected:', disconnectMessage);
  });

  stream.on('error', function (event) {
    console.log('there was an error:', event);
  });

}

module.exports = {
  start: start
};