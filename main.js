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

// Torus with glow effect
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ 
  color: 0xff6347, 
  emissive: 0xff6347,  // Set the emissive color to match the main color (for glow effect)
  emissiveIntensity: 1,  // Stronger emissive intensity to make it glow more
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

// GLTF Model Loading
const loader = new GLTFLoader();
let model;

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

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Make stars twinkle by adjusting their emissive intensity over time
  stars.forEach(star => {
    star.material.emissiveIntensity = 0.5 + Math.random() * 0.5;  // Random fluctuation between 0.5 and 1.0
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

// GitHub and LinkedIn Icon Setup
const githubIcon = document.createElement('div');
githubIcon.innerHTML = '<a href="https://github.com/Cgamber" target="_blank" style="font-size: 30px; color: white; position: fixed; bottom: 20px; right: 20px; display: none;">GitHub</a>';
document.body.appendChild(githubIcon);

const linkedinIcon = document.createElement('div');
linkedinIcon.innerHTML = '<a href="https://www.linkedin.com/in/chloegamber/" target="_blank" style="font-size: 30px; color: white; position: fixed; bottom: 20px; right: 80px; display: none;">LinkedIn</a>';
document.body.appendChild(linkedinIcon);

// Show GitHub and LinkedIn icons when the user scrolls to the bottom of the page
window.addEventListener('scroll', () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const bottomPosition = document.documentElement.scrollHeight;

  if (scrollPosition >= bottomPosition) {
    githubIcon.style.display = 'block';
    linkedinIcon.style.display = 'block';
  } else {
    githubIcon.style.display = 'none';
    linkedinIcon.style.display = 'none';
  }
});
