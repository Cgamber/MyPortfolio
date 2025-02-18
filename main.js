import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Setup scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Start camera with more zoomed-out position
camera.position.setZ(15);
renderer.render(scene, camera);

// Create a transparent beige torus with glow effect
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({
  color: 0xF5F5DC,  // Beige
  transparent: true, 
  opacity: 0.5,  
  emissive: 0xF5F5DC,  
  emissiveIntensity: 0.5,  
  metalness: 0.5,   
  roughness: 0.5    
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

// Add star function with glow
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1,
  });

  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));

  star.position.set(x, y, z);
  stars.push(star);
  scene.add(star);
}

// Optimize and increase number of stars
function addMultipleStars() {
  const totalStars = 1000;
  for (let i = 0; i < totalStars; i++) {
    addStar();
  }
}
addMultipleStars();

// Background video setup
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

// Load GLTF models (base model, cluster, gaming setup)
const loader = new GLTFLoader();
let model, gamingSetup; 

// Base model (base_basic_shadedGLTF)
loader.load('/base_basic_shadedGLTF.glb', (gltf) => {
  model = gltf.scene;
  model.rotation.y = Math.PI;
  model.scale.set(5, 5, 5);
  model.position.set(0, -3, 0);
  
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});

loader.load('/sphere.glb', (gltf) => {
  model = gltf.scene;
  model.rotation.y = Math.PI;
  model.scale.set(5, 5, 5);
  model.position.set(10, 5, 125);
  
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});

// Cluster model
loader.load('/cluster.glb', (gltf) => {
  const clusterSetup = gltf.scene;
  clusterSetup.position.set(-25, -5, -25);
  clusterSetup.scale.set(5, 5, 5);
  scene.add(clusterSetup);

  let floatTime = 0;

  function animateCluster() {
    requestAnimationFrame(animateCluster);
    clusterSetup.position.y = -5 + Math.sin(floatTime) * 2;
    floatTime += 0.02;
    composer.render();
  }

  animateCluster();
});

// Gaming setup model
loader.load('/gaming_setup_low-poly.glb', (gltf) => {
  gamingSetup = gltf.scene;
  gamingSetup.position.set(10, -5, 24);
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
eye.position.set(-10, 0, 50);

// Floating cg model
const cgTexture = new THREE.TextureLoader().load('cg.jpg');
const cg = new THREE.Mesh(
  new THREE.SphereGeometry(3, 3, 3),
  new THREE.MeshStandardMaterial({
    map: cgTexture,
    normalMap: normalTexture,
  })
);
scene.add(cg);
cg.position.set(-14, 0, 90);

// Mouse look function
function updateModelRotation(event) {
  if (model) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    model.rotation.y = (mouseX + 1) * Math.PI;
    model.rotation.x = mouseY * Math.PI / 2;
  }
}

document.addEventListener('mousemove', updateModelRotation);

// Scroll animation (Camera zoom control)
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  camera.position.z = Math.max(4, 15 + t * -0.05); 
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Effect Composer (bloom effect)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  
  0.4,  
  0.85  
);
composer.addPass(bloomPass);

// Time variable for twinkling effect
let time = 0;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the gaming setup model continuously
  if (gamingSetup) {
    gamingSetup.rotation.y += 0.01;
  }

  // Make stars twinkle faster
  time += 0.15;

  stars.forEach(star => {
    const twinkle = Math.sin(time + star.position.x * 0.1) * 0.5 + 0.5;
    star.material.emissiveIntensity = twinkle;
  });

  if (scene.background && scene.background instanceof THREE.VideoTexture) {
    scene.background.needsUpdate = true;
  }

  // Rotate torus
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  composer.render();
}

animate();

// Footer Scroll Visibility Logic
const footer = document.querySelector('footer');

// Function to check if the user has scrolled to the bottom
function checkScrollPosition() {
  // Check if the user has scrolled to the bottom of the page
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    // Show footer when at the bottom
    footer.style.display = 'flex';
  } else {
    // Hide footer when not at the bottom
    footer.style.display = 'none';
  }
}

// Add scroll event listener to check position on scroll
window.addEventListener('scroll', checkScrollPosition);

// Check the scroll position on page load (in case the user is already at the bottom)
checkScrollPosition();
