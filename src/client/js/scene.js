/*
 Based on 'Particles.html' example from Lee Stemkoski
 */


var Scene = (function () {
  'use strict';

  function setupCamera(scene, Screen) {
    var VIEW_ANGLE = 45,
      ASPECT = Screen.Width/ Screen.Height,
      NEAR = 0.1,
      FAR = 20000;

    var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);

    camera.position.set(0, 0, 1500);
    camera.lookAt(scene.position);

    return camera;
  }

  function createRenderer(Screen) {
    var renderer;
    if (Detector.webgl) {
      renderer = new THREE.WebGLRenderer({antialias: true});
    } else {
      renderer = new THREE.CanvasRenderer();
    }

    renderer.setSize(Screen.Width, Screen.Height);

    var container = document.getElementById('ThreeJS');
    container.appendChild(renderer.domElement);

    return renderer;
  }

  function setupStats() {
    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;

    var container = document.getElementById('ThreeJS');
    container.appendChild(stats.domElement);
    return stats;
  }

  function addLight(scene) {
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 450, 400);
    scene.add(light);
  }

  function addFloor(scene) {
    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 10, 10 );

    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;

    scene.add(floor);
  }

  function addSky(scene) {
    var skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x16457E, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);
  }

  function addSkyMap(scene) {
    var textureCube = THREEx.createTextureCube([
      '/images/texture.png', '/images/texture.png',
      '/images/texture.png', '/images/texture.png',
      '/images/texture.png', '/images/texture.png',
    ]);
    var mesh = THREEx.createSkymap({
      textureCube: textureCube,
      cubeW: 6000,
      cubeH: 6000,
      cubeD: 6000,
    });
    
    scene.add( mesh );
  }

  function createTweetConstellation(scene) {
    var tweetConstelation = new TweetConstellation(scene);
    tweetConstelation.initialize();
    return tweetConstelation;
  }

  return {
    //keyboard: new THREEx.KeyboardState(),

    setup: function setup() {
      var Screen = {
        Width: window.innerWidth,
        Height: window.innerHeight
      };

      var scene = new THREE.Scene();
      var camera = setupCamera(scene, Screen);
      var renderer = createRenderer(Screen);
      
      //scene.fog = new THREE.Fog( 0x000000, 1, 5000 );

      // Extension Setup
      THREEx.WindowResize(renderer, camera);
      THREEx.FullScreen.bindKey({charCode: 'm'.charCodeAt(0)});
      var controls = new THREE.OrbitControls(camera, renderer.domElement);

      var stats = setupStats();
      controls.minDistance = 1000;
      controls.maxDistance = 4500;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4; // 30 seconds per round when fps is 60


      addLight(scene);
      //addFloor(scene);
      //addSky(scene);
      addSkyMap(scene);



      var tweetConstellation = createTweetConstellation(scene);


      return {
        tweetConstellation: tweetConstellation,
        startAnimation: function () {
          var clock = new THREE.Clock();

          //AudioAnalyser.start();

          function animationFrame() {
            requestAnimationFrame(animationFrame);
            renderer.render(scene, camera);

            var dt = clock.getDelta();

            stats.update();
            controls.update();

            tweetConstellation.update(dt);
          }

          animationFrame();
        }
      };
    }

  };
})();




