'use strict';

module.exports = function(grunt) {

  require('jit-grunt')(grunt, {
  });

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  grunt.initConfig({});

  // Automatically inject Bower components into the app
  grunt.config.set('wiredep', {
    target: {
      src: 'src/client/index.html',
      ignorePath: '',
      exclude: []
    }
  });
};