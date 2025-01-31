// Import Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Configuration
const CONFIG = {
  gravity: 0.01,
  movementSpeed: 0.35,
  crouchSpeed: 0.175,
  jumpStrength: 0.6,
  crounchingJumpStrength: 0.3,
  bounceStrength: 0.35,
  cameraDistance: 10,
  totalApples: 12,
};

// Scene, Camera, Renderer Setup
let scene, camera, renderer, player;
let cameraAngleX = 0, cameraAngleY = 0.5;
let platforms = [], apples = [], appleData = [];
let isResetting = false;
let reachedCheckPoint = false;
let intervalId, time = 0;
let startTimer = false;
let timerRunning = false;

// Initialize the Scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Light blue

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = CONFIG.cameraDistance;
  camera.position.y = 5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  document.getElementById('apple-tally').innerText = "Apples: " + 0 + "/" + CONFIG.totalApples;

  loadCSV();
  backgroundAudio();
  sunSetup();
  moonSetup();
  setupLighting();
  loadLake();
  createPlatforms();
  setupControls();

  loadPlayer();

  animate();
}

function loadCSV() {
  fetch("./apple_quality.csv") // Replace with actual file path
  .then((response) => response.text())
  .then((csvData) => {
    // Parse CSV data
    Papa.parse(csvData, {
      header: true, // Converts rows into objects with headers as keys
      dynamicTyping: true, // Convert numeric strings to numbers
      complete: function (results) {
        const allData = results.data;
        // Shuffle the data array
        for (let i = allData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allData[i], allData[j]] = [allData[j], allData[i]];
        }
        // Select a random sample of totalApples number of rows
        appleData = allData.slice(0, CONFIG.totalApples);
      },
    });
  })
  .catch((error) => console.error("Error loading CSV:", error));
}

function backgroundAudio() {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('./happy-relaxing-loop.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(1);
    
    // Add user interaction to resume audio context
    document.addEventListener('click', () => {
      if (THREE.AudioContext.getContext().state === 'suspended') {
        THREE.AudioContext.getContext().resume();
      }
      sound.play();
    }, { once: true });
  });
}

function sunSetup() {
  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load('./sun&gernot.png');

  const geometry = new THREE.PlaneGeometry(100, 100);
  const material = new THREE.MeshBasicMaterial({ 
    map: bgTexture,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false 
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.z = -300;
  plane.position.y = 100;
  scene.add(plane);
}
function moonSetup() {
  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load('./moon&ben.png');

  const geometry = new THREE.PlaneGeometry(100, 100);
  const material = new THREE.MeshBasicMaterial({ 
    map: bgTexture,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false 
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.z = 300;
  plane.position.y = 100;
  scene.add(plane);
}

// Lighting Setup
function setupLighting() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;

  // Configure shadow properties for better realism
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;

  scene.add(directionalLight);

  // Add ambient light for softer shadows and more realistic lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
}

function loadLake() {
  const loader = new GLTFLoader();

  loader.load('./lake.glb', (gltf) => {
    const lake = gltf.scene;
    lake.scale.set(10, 10, 10);  // Adjust the model size here
    lake.position.set(0, 2.5, 0);
    scene.add(lake);
  }, undefined, (error) => {
    console.error(error);
  });
}

// Create Platforms
function createPlatforms() {
  const loader = new GLTFLoader();
  const platformData = [
    { x: 0, y: 0, z: 0 },
    { x: -7, y: 6, z: -5 },
    { x: -8, y: 13, z: 5 },
    { x: 10, y: 14, z: 0 },
    { x: 30, y: 15, z: 0 },
    { x: 20, y: 19, z: 0 },
    { x: 0, y: 21, z: -10 },
    { x: 0, y: 25, z: 10 },
    { x: 10, y: 29, z: -10 },
    { x: -10, y: 31, z: 10 },
    { x: -20, y: 33, z: -10 },
    { x: 20, y: 35, z: 10 },
    { x: 0, y: 37, z: 0 },
    { x: 10, y: 41, z: 20 },
    { x: -10, y: 45, z: 10 },
    { x: 20, y: 49, z: 10 },
    { x: 10, y: 53, z: -10 },
    { x: -10, y: 57, z: 10 },
    { x: 0, y: 61, z: -10 },
    { x: 10, y: 65, z: 0 },
    { x: -20, y: 69, z: 10 },
    { x: 20, y: 73, z: -10 },
    { x: 0, y: 77, z: 10 },
    { x: 10, y: 81, z: -10 },
    { x: -10, y: 85, z: 0 },
    { x: 20, y: 89, z: 10 },
    { x: -20, y: 93, z: -10 },
    { x: 0, y: 97, z: 0 },
    { x: 10, y: 101, z: 10 },
    { x: -10, y: 105, z: -10 },
    { x: 20, y: 109, z: 0 },
    { x: -15, y: 113, z: 10 },
    { x: -5, y: 119, z: -5 }
  ];

  platformData.forEach(({ x, y, z }) => {
    loader.load('./Lilypad.glb', (gltf) => {
      const platform = gltf.scene;
      platform.scale.set(3, 3, 3);  // Adjust the model size here
      platform.position.set(x, y, z);
      scene.add(platform);
      platform.boundingBox = new THREE.Box3().setFromObject(platform);
      platforms.push(platform);
      if (platforms.length === platformData.length) {
        loadCheckPoint();
      }
    }, undefined, (error) => {
      console.error(error);
    });
  });
}

class Player {
  constructor() {
    this.model = null;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isJumping = false;
    this.isCrouching = false;
    this.height = 1; // Default height (will be updated after model loads)
    this.boundingBox = new THREE.Box3(); // Player's bounding box
  }

  setHeightFromModel() {
    const box = new THREE.Box3().setFromObject(this.model);
    this.height = box.max.y - box.min.y;
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.model);

    // Visualize bounding box for debugging
    //if (this.debugBoundingBox) {
    //  scene.remove(this.debugBoundingBox); // Remove previous helper
    //}
    //this.debugBoundingBox = new THREE.BoxHelper(this.model, 0xff0000); // Add new helper
    //scene.add(this.debugBoundingBox)
  }

  resetPosition() {
    startTimer = false;
    timerRunning = false;
    clearInterval(intervalId); // Stop the timer
    time = 0;
    document.getElementById('timer').innerText = 'Time: 0s'; // Reset UI

    reachedCheckPoint = false;
    this.model.position.set(0, this.height / 2, 0);
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isJumping = false;
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('apple-tally').innerText = "Apples: " + 0 + "/" + CONFIG.totalApples;
    document.getElementById('apple-stats').innerHTML = '<div id="apple-stats-title">Apple Stats</div>';
    addApples();
    this.updateBoundingBox();
  }

  updateCrouch() {
    if (keys['Shift']) {
      // Hold to crouch
      if (!this.isCrouching) {
        this.isCrouching = true;
        const listener = new THREE.AudioListener();
        camera.add(listener);

        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./Rubber Duck - Sound Effect.mp3', (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(false);
          sound.setVolume(0.5);
          sound.play();
        });
        this.model.scale.y = 3; // Squash the model in the Y direction
        this.setHeightFromModel(); // Update player height
        this.updateBoundingBox(); // Update bounding box when crouching
      }
    } else {
      // When the key is released, return to standing
      if (this.isCrouching) {
        this.isCrouching = false;
        this.model.scale.y = 6; // Restore normal model scale
        this.setHeightFromModel(); // Update player height
        this.updateBoundingBox(); // Update bounding box when crouching
      }
    }
  }

  applyGravity(gravity, onPlatform) {
    if (!this.isJumping) {
      this.velocity.y -= gravity;
    }

    if (!onPlatform) {
      this.velocity.y -= gravity;
    }
  }

  updatePosition() {
    this.model.position.x += this.velocity.x;
    this.model.position.y += this.velocity.y;
    this.model.position.z += this.velocity.z;

    this.velocity.x *= 0.9; // Air resistance
    this.velocity.z *= 0.9; // Air resistance
  }

  spinPlayer() {
    if (!player.model) {
      console.error('Player model does not exist!');
      return; // Exit the function if the model is not found
    }

    const spinDuration = 1000; // Duration of the spin in milliseconds
    const startRotation = player.model.rotation.y;
    const endRotation = startRotation + Math.PI * 2; // 360 degrees for a full spin

    const startTime = performance.now();

    function spin() {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / spinDuration, 1); // Ensure progress does not exceed 1

        player.model.rotation.y = startRotation + (endRotation - startRotation) * progress;

        // After updating the rotation, render the scene
        renderer.render(scene, camera);

        if (progress < 1) {
            requestAnimationFrame(spin);
        }
    }

    requestAnimationFrame(spin);
  }
}

function loadPlayer() {
  const loader = new GLTFLoader();

  player = new Player();

  // Update playerHeight after the GLTF model is loaded
  loader.load('./free_rubber_duck_3d_model.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(6, 6, 6);  // Adjust the model size here
    model.position.y = 1;
    player.model = model;
    player.setHeightFromModel();
    scene.add(player.model);
  }, undefined, (error) => {
    console.error(error);
  });
}

class checkPoint {
  constructor() {
    this.model = null;
    this.boundingBox = new THREE.Box3();
  }

  addCheckPointToPlatform() {
    const lastPlatform = platforms[platforms.length - 1];
    this.model.position.set(lastPlatform.position.x, lastPlatform.position.y, lastPlatform.position.z); // Adjust the Y value to position it above the platform
    this.updateBoundingBox(); // Ensure the bounding box is updated after positioning
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.model);
  }

  reachedCheckPoint() {
    startTimer = false;
    timerRunning = false;
    clearInterval(intervalId); // Stop the timer

    const listener = new THREE.AudioListener();
        camera.add(listener);

        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./crowdyayapplause.mp3', (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(false);
          sound.setVolume(1);
          sound.play();
        });
    for (let i = 0; i < 3; i++) {
      player.spinPlayer();
    }
    const gameOver = document.getElementById('game-over');
    gameOver.style.display = 'block';
    document.getElementById('game-over-time').innerText = 'You completed the course in ' + time + 's!';
    document.getElementById('game-over-message').innerText = 'You collected ' + (CONFIG.totalApples - apples.length) + "/" + CONFIG.totalApples + ' apples!';
    document.getElementById('restart-button').onclick = () => {
      gameOver.style.display = 'none';
      player.resetPosition();
    };
  }
}

function loadCheckPoint() {
  const loader = new GLTFLoader();

  checkPoint = new checkPoint();

  loader.load('./checkpoint.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);  // Adjust the model size here
    model.position.y = 1;
    checkPoint.model = model;
    scene.add(checkPoint.model);

    checkPoint.addCheckPointToPlatform();
    addApples();
  }, undefined, (error) => {
    console.error(error);
  });
}

function checkPlatformCollision() {
  // Simple Collision Detection with Edge Tolerance
  const edgeTolerance = 0.4;
  let onPlatform = false;

  player.updateBoundingBox();

  // Updated Collision Detection Logic
  platforms.forEach((platform) => {
    if (platform.boundingBox.intersectsBox(player.boundingBox)) {
      const playerBottom = player.boundingBox.min.y;
      const playerTop = player.boundingBox.max.y;
      const platformTop = platform.boundingBox.max.y;
      const platformBottom = platform.boundingBox.min.y;

      // Check if the player is on top of the platform (falling down)
      if (playerBottom <= platformTop && player.velocity.y <= 0) {
        player.velocity.y = 0;
        player.isJumping = false;
        player.model.position.y = platformTop + player.height / 2 - edgeTolerance; // Snap player to platform
        onPlatform = true;
      }

      // Check for bottom collision (player hitting the platform from below)
      if (playerTop >= platformBottom && player.velocity.y > 0) {
        if (playerBottom < platformBottom) {
          player.velocity.y = -CONFIG.bounceStrength; // Apply a bounce force (negative velocity)
          player.model.position.y = platformBottom - player.height / 2 + edgeTolerance; // Ensure player is just below the platform
        }
      }
    }
  });

  return onPlatform;
}

function checkCheckPointCollision() {
  if (checkPoint.boundingBox.intersectsBox(player.boundingBox)) {
    reachedCheckPoint = true;
    checkPoint.reachedCheckPoint();
  }
}

class Apple {
  constructor() {
    this.model = null;
    this.boundingBox = new THREE.Box3();
  }

  addAppleToPlatform() {
    let platformHasApple, platformHasCheckPoint;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * (platforms.length - 1)) + 1;
      platformHasApple = apples.some(apple => apple.model && apple.model.position.equals(new THREE.Vector3(platforms[randomIndex].position.x, platforms[randomIndex].position.y + 1, platforms[randomIndex].position.z)));
      platformHasCheckPoint = checkPoint.model.position.equals(platforms[randomIndex].position);
    } while (platformHasApple || platformHasCheckPoint);
    const randomPlatform = platforms[randomIndex];
    this.model.position.set(randomPlatform.position.x, randomPlatform.position.y + 1, randomPlatform.position.z);
    this.updateBoundingBox(); // Ensure the bounding box is updated after positioning
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.model);
  }

  checkAppleCollision() {
    player.updateBoundingBox();

    if (this.boundingBox.intersectsBox(player.boundingBox)) {
      this.collectApple();
    }
  }

  collectApple() {
    player.spinPlayer();

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./apple-bite-&-chew.mp3', (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
    });

    const appleIndex = (CONFIG.totalApples - apples.length);
    const appleStats = appleData[appleIndex];
    const appleStatsElement = document.getElementById('apple-stats');
    appleStatsElement.innerHTML = `
      <div id="apple-stats-title">Apple Stats</div>
      <ul id="apple-stats-list">
        <li>A_id: ${appleStats.A_id}</li>
        <li>Size: ${appleStats.Size}</li>
        <li>Weight: ${appleStats.Weight}</li>
        <li>Sweetness: ${appleStats.Sweetness}</li>
        <li>Crunchiness: ${appleStats.Crunchiness}</li>
        <li>Juiciness: ${appleStats.Juiciness}</li>
        <li>Ripeness: ${appleStats.Ripeness}</li>
        <li>Acidity: ${appleStats.Acidity}</li>
        <li>Quality: ${appleStats.Quality}</li>
    `;
    apples.splice(apples.indexOf(this), 1);
    scene.remove(this.model);
    this.model = null;

    document.getElementById('apple-tally').innerText = "Apples: " + (CONFIG.totalApples - apples.length) + "/" + CONFIG.totalApples;
  }
}

function addApples() {
  apples.forEach((apple) => {
    if (apple.model) {
      scene.remove(apple.model);
    }
  });
  apples = []; // Reset apples array

  console.trace();

  const loader = new GLTFLoader();

  for (let i = 0; i < CONFIG.totalApples; i++) {

    let apple = new Apple();

    loader.load('./apple.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);  // Adjust the model size here
      apple.model = model;
      apples.push(apple);
      apple.addAppleToPlatform();
      scene.add(apple.model);
    }, undefined, (error) => {
      console.error(error);
    });
  }
}

function updateCamera() {
  // Update Camera Position Based on Rotation Angles
  const heightOffset = player.isCrouching ? 0.5 : 2; // Height of the camera above the player
  const offsetX = CONFIG.cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
  const offsetY = CONFIG.cameraDistance * Math.sin(cameraAngleY);
  const offsetZ = CONFIG.cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);

  camera.position.x = player.model.position.x + offsetX;
  camera.position.y = player.model.position.y + heightOffset + offsetY;
  camera.position.z = player.model.position.z + offsetZ;

  // Make the camera look at the player
  camera.lookAt(player.model.position);

  // Rotate player to face the same direction as the camera's forward vector
  if (player.model) {
    player.model.rotation.y = cameraAngleX + Math.PI; // Rotate 180 degrees to face away from the camera
  }
}

// Keyboard Controls
const keys = {};
function setupControls() {
  document.addEventListener('keydown', (e) => {
    const timer = document.getElementById('timer');
    if (!timerRunning && !reachedCheckPoint) {
      timerRunning = true;
      startTimer = true;
      intervalId = setInterval(() => {
        if (startTimer) {
          time += 1;
          timer.innerText = 'Time: ' + time + 's';
        } else {
          clearInterval(intervalId);
          timerRunning = false; // Allow restarting the timer
        }
      }, 1000);
    }

    // Normalize letter keys (e.g., 'w' or 'W' both become 'w')
    if (/^[a-zA-Z]$/.test(e.key)) {
      keys[e.key.toLowerCase()] = true; // Normalize to lowercase
    } 
    // Handle arrow keys, Shift, and Space keys
    else if (/^Arrow/.test(e.key) || e.key === 'Shift' || e.key === ' ') {
      keys[e.key] = true;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    // Normalize letter keys (e.g., 'w' or 'W' both become 'w')
    if (/^[a-zA-Z]$/.test(e.key)) {
      keys[e.key.toLowerCase()] = false; // Normalize to lowercase
    }
    // Handle arrow keys, Shift, and Space keys
    else if (/^Arrow/.test(e.key) || e.key === 'Shift' || e.key === ' ') {
      keys[e.key] = false;
    }
  });
}

function handleInput() {

  // Movement Input
  const moveDirection = new THREE.Vector3();

  // Calculate Camera Direction Vectors
  const forwardVector = new THREE.Vector3(
    -Math.sin(cameraAngleX), // Negative because Three.js uses a right-handed coordinate system
    0,
    -Math.cos(cameraAngleX)  // Negative to align with the forward Z-axis
  ).normalize();
  
  const rightVector = new THREE.Vector3(
    Math.cos(cameraAngleX), // Positive for right vector
    0,
    -Math.sin(cameraAngleX) // Negative for correct perpendicularity
  ).normalize();

  if (keys['w']) {
    moveDirection.add(forwardVector)
    //console.log('w key pressed');
  }; // Forward
  if (keys['s']) {
    moveDirection.sub(forwardVector)
    //console.log('s key pressed');
  }; // Backward
  if (keys['a']) {
    moveDirection.sub(rightVector)
    //console.log('a key pressed');
  };  // Left
  if (keys['d']) {
    moveDirection.add(rightVector);  
    //console.log('d key pressed');
  }; // Right

  // Normalize direction to prevent diagonal speed boost
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
  }

  player.velocity.x = moveDirection.x * (player.isCrouching ? CONFIG.crouchSpeed : CONFIG.movementSpeed); 
  player.velocity.z = moveDirection.z * (player.isCrouching ? CONFIG.crouchSpeed : CONFIG.movementSpeed);  

  // Jumping logic
  if (keys[' '] && !player.isJumping) {
    player.velocity.y = (player.isCrouching ? CONFIG.crounchingJumpStrength : CONFIG.jumpStrength);
    player.isJumping = true;
  }

  if (keys['r'] && !isResetting) {
    isResetting = true;  // Prevent multiple calls
    player.resetPosition();
    setTimeout(() => isResetting = false, 100); // Reset after a short delay
  }

  // Camera Rotation
  if (keys['ArrowLeft']) cameraAngleX += 0.05; // Rotate left
  if (keys['ArrowRight']) cameraAngleX -= 0.05; // Rotate right
  if (keys['ArrowUp']) cameraAngleY = Math.min(cameraAngleY + 0.05, Math.PI / 2 - 0.1); // Look up (clamped)
  if (keys['ArrowDown']) cameraAngleY = Math.max(cameraAngleY - 0.05, -Math.PI / 2 + 0.1); // Look down (clamped)

  player.updateCrouch();
}

// Game Loop
function animate() {
  requestAnimationFrame(animate);

  if (player.model !== null) {
    handleInput();

    if (player.model.position.y < -20) {
      player.resetPosition();
    }

    // Check for collisions with apples
    apples.forEach((apple) => {
      if (apple.model) {
        apple.checkAppleCollision();
      }
    });

    if (!reachedCheckPoint) {
      checkCheckPointCollision();
    }
    
    const onPlatform = checkPlatformCollision();

    player.applyGravity(CONFIG.gravity, onPlatform);


    if (!onPlatform) {
      player.applyGravity(CONFIG.gravity, onPlatform);
    }

    player.updatePosition();
    player.updateBoundingBox();
    updateCamera();
    renderer.render(scene, camera);
  }
}

init();
