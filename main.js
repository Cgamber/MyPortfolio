import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Start the camera more zoomed out from the model
camera.position.setZ(15);  // Increased from 10 to 15 to zoom out more
renderer.render(scene, camera);

// Torus with transparent beige color
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({
  color: 0xF5F5DC, // Beige color
  transparent: true,  // Enable transparency
  opacity: 0.5,  // Adjust opacity for transparency (0 is fully transparent, 1 is fully opaque)
  emissive: 0xF5F5DC,  // Set the emissive color to beige for a glowing effect (optional)
  emissiveIntensity: 0.5,  // Optional: Makes the glow less intense
  metalness: 0.5,   // Optional: Makes the material shinier
  roughness: 0.5    // Optional: Adjust roughness for more realistic shading
});
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);

// Store stars for later use
const stars = [];

// Function to add a star with glow effect
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  
  // Make the star emissive to make it glow
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff, // Make the star glow
    emissiveIntensity: 1, // Stronger glow for stars
  });
  
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(200));  // Increased range for more spread

  star.position.set(x, y, z);
  stars.push(star); // Add the star to the array for later use
  scene.add(star);
}

// Increase the number of stars added
Array(1000).fill().forEach(addStar);  // Increase the number to 1000 stars

// Background Video Setup
function setBackgroundVideo(scene, videoUrl) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.load();
  video.muted = true;
  video.play();
  video.loop = true;

  const videoTexture = new THREE.VideoTexture(video);
  scene.background = videoTexture;

  video.addEventListener('play', () => {
    console.log('Video is playing');
  });
}

setBackgroundVideo(scene, 'wavesanimation0001-0250.mp4');

// GLTF Model Loading (Your existing model)
const loader = new GLTFLoader();
let model;
let gamingSetup;  // Declare variable for the gaming setup model

loader.load('/base_basic_shadedGLTF.glb', (gltf) => {
  model = gltf.scene;
  
  // Correct the initial rotation of the model to face the camera
  model.rotation.y = Math.PI;  // Rotate 180 degrees on the Y-axis to face forward

  // Scale the model to make it larger (adjust values as necessary)
  model.scale.set(5, 5, 5);  // This will make the model 5 times larger

  // Lower the model on the Y-axis further
  model.position.set(0, -3, 0);  // Lowering the model by 3 units on the Y-axis

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});

// Cluster model loading
loader.load('/cluster.glb', (gltf) => {
  const clusterSetup = gltf.scene;
  clusterSetup.position.set(-25, -5, 5);  // Move cluster to the left of the first model
  clusterSetup.scale.set(5, 5, 5);
  scene.add(clusterSetup);

  // Floating animation
  let floatTime = 0;

  // Animation loop to make the cluster float
  function animateCluster() {
    requestAnimationFrame(animateCluster);

    // Sine wave function to make the model float up and down
    clusterSetup.position.y = -5 + Math.sin(floatTime) * 2;  // Adjust amplitude (2) for the height of the floating

    // Increment time for the sine function to animate
    floatTime += 0.02;  // Speed of floating movement

    // Render the scene
    composer.render();
  }

  animateCluster();
});

// Load gaming setup model
loader.load('/gaming_setup_low-poly.glb', (gltf) => {
  gamingSetup = gltf.scene;
  gamingSetup.position.set(10, -5, 20);
  gamingSetup.scale.set(5, 5, 5);
  scene.add(gamingSetup);
});

// Textures for eye and cg
const eyeTexture = new THREE.TextureLoader().load('eye.jpg');
const normalTexture = new THREE.TextureLoader().load('normal.jpg');

const eye = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: eyeTexture,
    normalMap: normalTexture,
  })
);

scene.add(eye);
eye.position.z = 30;
eye.position.setX(-10);

// Floating eyeModel (Another GLTF or texture-based model)
const cgTexture = new THREE.TextureLoader().load('cg.jpg');

const cg = new THREE.Mesh(
  new THREE.SphereGeometry(3, 3, 3),
  new THREE.MeshStandardMaterial({
    map: cgTexture,
    normalMap: normalTexture,
  })
);

scene.add(cg);
cg.position.z = 50;
cg.position.setX(-14);

// Mouse Look Function
function updateModelRotation(event) {
  if (model) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    let mouseY = (event.clientY / window.innerHeight) * 2 - 1;

    const adjustedMouseX = (mouseX + 1) * Math.PI;
    const adjustedMouseY = mouseY * Math.PI / 2;

    model.rotation.y = adjustedMouseX;
    model.rotation.x = adjustedMouseY;
  }
}

document.addEventListener('mousemove', updateModelRotation);

// Scroll Animation (Camera zoom out on scroll)
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  // Limiting zoom in by setting a minimum value of z position
  camera.position.z = Math.max(4, 15 + t * -0.05);  // Keep the camera more zoomed out
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Effect Composer (to apply bloom effect)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // Strength of the bloom effect
  0.4,  // Radius of the bloom effect
  0.85  // Threshold of brightness to apply bloom
);
composer.addPass(bloomPass);

// Time variable for controlling the twinkle rate
let time = 0;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the gaming setup model continuously
  if (gamingSetup) {
    gamingSetup.rotation.y += 0.01;  // Adjust the speed of rotation by changing the value (0.01)
  }

  // Increment time to create a twinkling effect (faster twinkling)
  time += 0.15; // Adjusted to make it twinkle a little faster

  // Make stars twinkle by adjusting their emissive intensity slowly
  stars.forEach(star => {
    // Use sine function to create smooth twinkling
    const twinkle = Math.sin(time + star.position.x * 0.1) * 0.5 + 0.5;  // Adjust to control speed and intensity
    star.material.emissiveIntensity = twinkle;  // Make it twinkle faster
  });

  if (scene.background && scene.background instanceof THREE.VideoTexture) {
    scene.background.needsUpdate = true;
  }

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  composer.render();
}

animate();
