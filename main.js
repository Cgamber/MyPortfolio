import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// --- 1. SETUP & RENDERER ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

// OPTIMIZATION: Static Shadows
// We will calculate shadows ONCE. We will NOT update them in the animation loop.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; 

camera.position.setZ(15);

// --- 2. LOADING MANAGER (THE LOADING BAR LOGIC) ---
const loadingManager = new THREE.LoadingManager();

const progressBar = document.getElementById('progress-bar');
const loadingScreen = document.getElementById('loading-screen');

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  if (progressBar) {
    progressBar.value = (itemsLoaded / itemsTotal) * 100;
  }
};

loadingManager.onLoad = () => {
  console.log('✅ All assets loaded!');
  // Calculate shadows one last time to ensure everything looks right
  renderer.shadowMap.needsUpdate = true;
  
  // Fade out loading screen
  if (loadingScreen) {
    loadingScreen.style.opacity = 0;
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
};

// --- 3. LIGHTING ---
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 50;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(pointLight, ambientLight);

// --- 4. INSTANCED STARS (Minimal Count) ---
const starGeometry = new THREE.SphereGeometry(0.25, 4, 4);
const starMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 1,
});

const starCount = 200;
const starMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
scene.add(starMesh);

const dummy = new THREE.Object3D();
for (let i = 0; i < starCount; i++) {
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(400));
  dummy.position.set(x, y, z);
  dummy.updateMatrix();
  starMesh.setMatrixAt(i, dummy.matrix);
}
starMesh.instanceMatrix.needsUpdate = true;

// --- 5. TORUS ---
const torusGeo = new THREE.TorusGeometry(10, 3, 10, 50);
const torusMat = new THREE.MeshStandardMaterial({
  color: 0xF5F5DC,
  transparent: true,
  opacity: 0.5,
  emissive: 0xF5F5DC,
  emissiveIntensity: 0.5,
  metalness: 0.5,
  roughness: 0.5
});
const torus = new THREE.Mesh(torusGeo, torusMat);
scene.add(torus);

// --- 6. VIDEO BACKGROUND ---
let videoTexture = null;
function setBackgroundVideo(scene, videoUrl) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.load();
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";

  video.oncanplay = () => {
    video.play();
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = videoTexture;
  };
}
setBackgroundVideo(scene, '/videos/drawing.mp4');

// --- 7. MODEL LOADER ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);

// Store models here to rotate them later
const floatingModels = [];

function loadFloatingModel(path, scale, position, rotation = [0, 0, 0]) {
  loader.load(path, (gltf) => {
    const model = gltf.scene;
    model.scale.set(scale, scale, scale);
    model.position.set(position[0], position[1], position[2]);
    model.rotation.set(rotation[0], rotation[1], rotation[2]);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    });

    scene.add(model);
    
    // We only push to array, but we won't bob them up and down anymore
    floatingModels.push({
      mesh: model,
    });
    
    // Update static shadows once because a new object arrived
    renderer.shadowMap.needsUpdate = true;
  });
}

// Load Models
let baseModel;
loader.load('/models/base_basic_shadedGLTF.glb', (gltf) => {
  baseModel = gltf.scene;
  baseModel.scale.set(5, 5, 5);
  baseModel.position.set(0, -3, 0);
  baseModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(baseModel);
  renderer.shadowMap.needsUpdate = true;
});

// Load all items
loadFloatingModel('/models/visual_studio_logo.glb', 0.5, [-25, -5, 20], [0, Math.PI, 0]);
loadFloatingModel('/models/c++.glb', 0.05, [-20, -5, 20]);
loadFloatingModel('/models/cc.glb', 0.05, [-15, -5, 20]);
loadFloatingModel('/models/pyth.glb', 0.5, [-10, -5, 20]);
loadFloatingModel('/models/h.glb', 0.015, [-5, -8, 20]);
loadFloatingModel('/models/css.glb', 0.015, [0, -8, 20]);
loadFloatingModel('/models/js.glb', 0.15, [4, -5, 20], [-10, 20, -20]);
loadFloatingModel('/models/react.glb', 0.5, [8, -5, 20], [0.25, Math.PI, 0]);
loadFloatingModel('/models/figma.glb', 1, [14, -5, 20]);
loadFloatingModel('/models/blender.glb', 1, [11, -5, 20], [0.25, Math.PI, 0]);
loadFloatingModel('/models/unity.glb', 0.3, [17, -5, 20], [1, Math.PI, 0]);
loadFloatingModel('/models/cluster.glb', 5, [-25, -5, -25]);

// Sphere
loader.load('/models/sphere.glb', (gltf) => {
  const sphereModel = gltf.scene;
  sphereModel.rotation.y = Math.PI / 2;
  sphereModel.scale.set(5, 5, 5);
  sphereModel.position.set(10, -15, 120);
  sphereModel.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.material = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0x808080,
        emissiveIntensity: 1.5,
        metalness: 0.5,
        roughness: 0.5,
      });
    }
  });
  scene.add(sphereModel);
});

// Gaming Setup
loader.load('/models/gaming_setup_low-poly.glb', (gltf) => {
  const gamingSetup = gltf.scene;
  gamingSetup.position.set(25, -5, 30);
  gamingSetup.scale.set(5, 5, 5);
  gamingSetup.rotation.y = Math.PI;
  scene.add(gamingSetup);
});

// --- 8. PROFILE CUBE ---
const tLoader = new THREE.TextureLoader(loadingManager);

const profileTexture = tLoader.load('/textures/profilepic.jpg');
profileTexture.colorSpace = THREE.SRGBColorSpace;

const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
const cubeMaterial = new THREE.MeshStandardMaterial({
  map: profileTexture,
  metalness: 0.1,
  roughness: 0.4,
  emissive: 0xffffff,
  emissiveMap: profileTexture,
  emissiveIntensity: 1.0,
});
const profileCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(profileCube);
profileCube.position.set(15, 5, 20);
profileCube.rotation.y = Math.PI;

floatingModels.push({ mesh: profileCube });

// Eyes
const eyeTexture = tLoader.load('/textures/eye1.jpg');
const normalTexture = tLoader.load('/textures/normal.jpg');
const cgTexture = tLoader.load('/textures/cg.jpg');

const eyeGeo = new THREE.SphereGeometry(3, 24, 24);
const eye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ map: eyeTexture, normalMap: normalTexture }));
scene.add(eye);
eye.position.set(-20, 0, 90);

const cg = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ map: cgTexture, normalMap: normalTexture }));
scene.add(cg);
cg.position.set(-24, 0, 110);


// --- 9. EVENTS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function updateModelRotation(event) {
  if (baseModel) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    baseModel.rotation.y = mouseX * Math.PI * 0.5;
    baseModel.rotation.x = mouseY * Math.PI * 0.25;
  }
}
document.addEventListener('mousemove', updateModelRotation);

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  camera.position.z = Math.max(4, 15 + t * -0.05);
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}
document.body.onscroll = moveCamera;
moveCamera();

// --- 10. POST PROCESSING ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
  0.8,
  1.0,
  4.0
);
composer.addPass(bloomPass);


// --- 11. ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // 1. Video Update
  if (videoTexture) videoTexture.needsUpdate = true;

  // 2. Torus - Keep rotation (it's cheap)
  torus.rotation.x += 0.1 * 0.01;
  torus.rotation.y += 0.05 * 0.01;
  torus.rotation.z += 0.1 * 0.01;

  // 3. Floating Items - ROTATION ONLY (No Bobbing)
  // Bobbing (moving up/down) forces shadow recalculation. 
  // Rotating in place does not require shadow updates for static lights.
  floatingModels.forEach(obj => {
    if (obj.mesh === profileCube) {
      obj.mesh.rotation.x += 0.002;
      obj.mesh.rotation.y += 0.002;
    } else {
      // Optional: Give other icons a tiny rotation so they aren't frozen
      obj.mesh.rotation.y += 0.002; 
    }
  });

  // 4. Stars
  starMesh.rotation.y += 0.0001;

  // 5. Eye
  if (eye) eye.rotation.y += 0.002;

  controls.update();

  // PERFORMANCE SAVER:
  // We removed "renderer.shadowMap.needsUpdate = true" from here.
  // This means shadows are static. This saves HUGE amounts of GPU.
  
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});