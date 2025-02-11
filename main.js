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
  model.rotation.x = Math.PI / 2;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  model.position.set(5, 0, -5);

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

  camera.position.z = Math.max(0.5, 1 + t * -0.05);
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  if (scene.background && scene.background instanceof THREE.VideoTexture) {
    scene.background.needsUpdate = true;
  }

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  renderer.render(scene, camera);
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
