import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Start the camera zoomed in on the model
camera.position.setZ(1);  // Initially closer to the model

renderer.render(scene, camera);

// Torus with glow effect
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ 
  color: 0xff6347, 
  emissive: 0xffffff,  // Set the emissive color to white
  emissiveIntensity: 0.5,  // Adjust the intensity of the glow
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

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

// Background Video Setup
function setBackgroundVideo(scene, videoUrl) {
  // Create a video element
  const video = document.createElement('video');
  video.src = videoUrl;  // URL of the video you want to use
  video.load();  // Start loading the video
  video.muted = true;  // Mute the video to allow autoplay
  video.play();  // Play the video immediately
  video.loop = true;  // Set the video to loop

  // Create a texture from the video
  const videoTexture = new THREE.VideoTexture(video);

  // Set the video texture as the scene background
  scene.background = videoTexture;

  // Log when the video starts playing
  video.addEventListener('play', () => {
    console.log('Video is playing');
  });
}

setBackgroundVideo(scene, 'wavesanimation0001-0250.mp4');  // Set the background video here

// GLTF Model Loading
const loader = new GLTFLoader();
let model; // Declare the model variable

loader.load('/base_basic_shadedGLTF.glb', (gltf) => {
  model = gltf.scene;
  model.rotation.x = Math.PI / 2; // Same rotation as in the original code

  // Optionally enable shadows
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Move the model to the far right
  model.position.set(5, 0, -5); // Move the model to the right along the X-axis

  scene.add(model);
});

// Mouse Look Function
function updateModelRotation(event) {
  if (model) {
    // Get normalized mouse position
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    let mouseY = (event.clientY / window.innerHeight) * 2 - 1; // Invert the Y-axis to match the mouse position

    // Adjust the rotation as if the model is still at the center
    const adjustedMouseX = (mouseX + 1) * Math.PI;  // Map the X-axis to rotation, range [-1,1] to [-Math.PI, Math.PI]
    const adjustedMouseY = (mouseY) * Math.PI / 2;  // Vertical movement

    // Update the model's rotation based on mouse position
    model.rotation.y = adjustedMouseX; // Horizontal movement (left/right)
    model.rotation.x = adjustedMouseY; // Vertical movement (up/down)
  }
}

// Listen for mouse movement
document.addEventListener('mousemove', updateModelRotation);

// Scroll Animation (Camera zoom out on scroll)
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  // Camera zoom effect on scroll (start zoomed in and zoom out as you scroll)
  // Set camera to zoom all the way into the model when scrolling
  camera.position.z = Math.max(0.5, 1 + t * -0.05); // Allow zoom in until 0.5 unit distance
  camera.position.x = t * -0.0002;   // Slight pan effect on scroll
  camera.rotation.y = t * -0.0002;   // Slight rotation effect on scroll
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Ensure the video texture updates every frame
  if (scene.background && scene.background instanceof THREE.VideoTexture) {
    scene.background.needsUpdate = true;
  }

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;
 
  renderer.render(scene, camera);
}

animate();
