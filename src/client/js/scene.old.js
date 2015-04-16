/*
 Based on 'Particles.html' example from Lee Stemkoski
 */

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// custom global variables
var cube;




// Constants


init();
animate();

// FUNCTIONS
function init()
{
  // SCENE
  scene = new THREE.Scene();

  // CAMERA
  var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight;

  var VIEW_ANGLE = 45,
    ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
    NEAR = 0.1,
    FAR = 20000;

  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);

  camera.position.set(0,900,800);
  camera.lookAt(scene.position);

  // RENDERER
  if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
  else
    renderer = new THREE.CanvasRenderer();

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container = document.getElementById( 'ThreeJS' );
  container.appendChild( renderer.domElement );

  // EVENTS
  THREEx.WindowResize(renderer, camera);
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

  // CONTROLS
  controls = new THREE.OrbitControls( camera, renderer.domElement );

  // STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );

  // LIGHT
  var light = new THREE.PointLight(0xffffff);
  light.position.set(0,250,0);
  scene.add(light);

  // FLOOR
  // var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
  // floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  // floorTexture.repeat.set( 10, 10 );
  // var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
  // var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  // var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // floor.position.y = -0.5;
  // floor.rotation.x = Math.PI / 2;
  // scene.add(floor);

  // SKYBOX/FOG
  var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x16457E, side: THREE.BackSide } );
  var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  scene.add(skyBox);
  // skybox works better for alpha blending with images.

  ////////////
  // CUSTOM //
  ////////////

  tweetConstelation = new TweetConstelation(scene);
  tweetConstelation.initialize();
//  var particleTexture = THREE.ImageUtils.loadTexture( 'images/spark.png' );
//
//  particleGroup = new THREE.Object3D();
//  particleAttributes = { startSize: [], startPosition: [], randomness: [] };
//
//  var totalParticles = 10;
//  var radiusRange = 100;
//  for( var i = 0; i < totalParticles; i++ )
//  {
//    var spriteMaterial = new THREE.SpriteMaterial( { map: particleTexture, useScreenCoordinates: false, color: 0xff0000 } );
//
//    var sprite = new THREE.Sprite( spriteMaterial );
//    sprite.scale.set( 32, 32, 1.0 ); // imageWidth, imageHeight
//    sprite.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
//
//    // for a cube:
//    // sprite.position.multiplyScalar( radiusRange );
//    // for a solid sphere:
//    // sprite.position.setLength( radiusRange * Math.random() );
//    // for a spherical shell:
//    //sprite.position.setLength( radiusRange * (Math.random() ) );
//
//    // sprite.color.setRGB( Math.random(),  Math.random(),  Math.random() );
//    sprite.material.color.setHSL( Math.random(), 0.9, 0.7 );
//
//    // sprite.opacity = 0.80; // translucent particles
//    sprite.material.blending = THREE.AdditiveBlending; // "glowing" particles
//
//    particleGroup.add( sprite );
//    // add variable qualities to arrays, if they need to be accessed later
//    particleAttributes.startPosition.push( sprite.position.clone() );
//    particleAttributes.randomness.push( Math.random() );
//  }
//  particleGroup.position.y = 100;
//  scene.add( particleGroup );
}

//var particleGroup, particleAttributes;
var tweetConstelation;

function animate()
{
  requestAnimationFrame( animate );
  render();
  update();
}

function update()
{
  var dt = clock.getDelta();
  tweetConstelation.update(dt);

  //var time = 4 * clock.getElapsedTime();

  //for ( var c = 0; c < particleGroup.children.length; c ++ )
  //{
  //  var sprite = particleGroup.children[ c ];
  //
  //  // particle wiggle
  //  var wiggleScale = 2;
  //  sprite.position.x += wiggleScale * (Math.random() - 0.5);
  //  sprite.position.y += wiggleScale * (Math.random() - 0.5);
  //  sprite.position.z += wiggleScale * (Math.random() - 0.5);
  //
  //  // pulse away/towards center
  //  // individual rates of movement
  //  var a = particleAttributes.randomness[c] + 1;
  //  var pulseFactor = Math.sin(a * time) * 0.1 + 0.9;
  //  sprite.position.x = particleAttributes.startPosition[c].x * pulseFactor;
  //  sprite.position.y = particleAttributes.startPosition[c].y * pulseFactor;
  //  sprite.position.z = particleAttributes.startPosition[c].z * pulseFactor;
  //}

  // rotate the entire group
  // particleGroup.rotation.x = time * 0.5;
  //particleGroup.rotation.y = time * 0.75;
  // particleGroup.rotation.z = time * 1.0;

  controls.update();
  stats.update();
}

function render()
{
  renderer.render( scene, camera );
}
