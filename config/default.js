'use strict';

module.exports = {
  streamTrack: [ '#love', "#hate", "love", "hate"],
  //streamTrack: ['#BAFrontend'],
  realData: true,
  augment: false,
  augmentUrl: 'http://localhost:9099/api/tasks/twitter/twitterfromraw/flowics/-1?outformat=targetmention',
  credentials: {
    "consumer_key": "",
    "consumer_secret": "",
    "access_token": "",
    "access_token_secret": ""
  }
};