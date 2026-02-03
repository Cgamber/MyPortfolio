import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
const ENABLE_SPHERES = false;
let eye = null;
let cg = null;

// --- 0. TOOLTIP SETUP ---
const tooltip = document.createElement('div');
Object.assign(tooltip.style, {
  position: 'fixed',
  padding: '8px 12px',
  background: 'rgba(0, 0, 0, 0.85)',
  color: '#00f2ff',
  borderRadius: '4px',
  pointerEvents: 'none',
  display: 'none',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  border: '1px solid #00f2ff',
  boxShadow: '0 0 10px rgba(0, 242, 255, 0.3)',
  zIndex: '9999',
  willChange: 'transform' 
});
document.body.appendChild(tooltip);

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

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; // Ensures colors look correct
camera.position.setZ(15);

// --- 2. INTERACTION VARIABLES ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isZoomed = false;
let zoomTargetPos = new THREE.Vector3();
let defaultTargetZ = 15;
let targetX = 0;
let targetRotY = 0;
const zoomableObjects = []; 
let hoveredObject = null;
let needsRaycast = false;

// --- 3. LOADING MANAGER (Optimized) ---
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => {
  // Pre-compile shaders so the screen doesn't lag when it reveals
  renderer.compile(scene, camera);
  
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = 0;
    setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
  }
};

// --- 4. LIGHTING ---
const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(5, 5, 5);
scene.add(pointLight, new THREE.AmbientLight(0xffffff, 0.6));

// --- 5. ASSETS ---
//*const torus = new THREE.Mesh(
 // new THREE.TorusGeometry(10, 3, 10, 50),
 // new THREE.MeshStandardMaterial({ color: 0xF5F5DC, transparent: true, opacity: 0.15 })
//);
//torus.matrixAutoUpdate = false;
//torus.updateMatrix();
//scene.add(torus);


const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true });
const starVertices = [];
for (let i = 0; i < 800; i++) {
  starVertices.push(THREE.MathUtils.randFloatSpread(1000), THREE.MathUtils.randFloatSpread(1000), THREE.MathUtils.randFloatSpread(1000));
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- 6. VIDEO BACKGROUND (Non-blocking) ---
const video = document.createElement('video');
video.src = '/videos/drawing.mp4';
video.muted = true; video.loop = true; video.playsInline = true; video.crossOrigin = "anonymous";
video.play();
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = videoTexture;

// --- 7. MODEL LOADER (Parallelized) ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.preload();

const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);

function loadModel(path, scale, position, name = null, rotation = [0, 0, 0]) {
  loader.load(path, (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(scale);
    model.position.set(...position);
    model.rotation.set(...rotation);
    if (name) model.userData.name = name; 
    
    model.traverse(c => {
      if (c.isMesh) {
        c.frustumCulled = false; 
        // Optimization: Static models don't need matrix updates
        c.matrixAutoUpdate = name ? false : true;
        if (name) c.updateMatrix();
      }
    });
    scene.add(model);
    zoomableObjects.push(model);
  });
}

// Start loading all models simultaneously
loadModel('/models/visual_studio_logo.glb', 0.5, [-25, -5, 20], "VS Code", [0, Math.PI, 0]);
loadModel('/models/c++.glb', 0.05, [-20, -5, 20], "C++");
loadModel('/models/cc.glb', 0.05, [-15, -5, 20], "C#");
loadModel('/models/pyth.glb', 0.5, [-10, -5, 20], "Python");
loadModel('/models/h.glb', 0.015, [-5, -8, 20], "HTML5");
loadModel('/models/css.glb', 0.015, [0, -8, 20], "CSS3");
loadModel('/models/js.glb', 0.15, [4, -5, 20], "JavaScript", [-10, 20, -20]);
loadModel('/models/react.glb', 0.5, [8, -5, 20], "React", [0.25, Math.PI, 0]);
loadModel('/models/figma.glb', 1, [14, -5, 20], "Figma");
loadModel('/models/blender.glb', 1, [11, -5, 20], "Blender", [0.25, Math.PI, 0]);
loadModel('/models/unity.glb', 0.3, [17, -5, 20], "Unity", [1, Math.PI, 0]);
loadModel('/models/cluster.glb', 5, [-25, -5, -25]);

let baseModel;
loader.load('/models/base_basic_shadedGLTF.glb', (gltf) => {
  baseModel = gltf.scene;
  baseModel.scale.setScalar(5);
  baseModel.position.set(0, -3, 0);
  scene.add(baseModel);
  zoomableObjects.push(baseModel);
});

// --- 8. TEXTURES ---
const tLoader = new THREE.TextureLoader(loadingManager);
const commonNormalMap = tLoader.load('/textures/normal.jpg');
const profileTexture = tLoader.load('/textures/profilepic.jpg');
profileTexture.colorSpace = THREE.SRGBColorSpace;

const profileCube = new THREE.Mesh(
  new THREE.BoxGeometry(5, 5, 5),
  new THREE.MeshStandardMaterial({ 
    map: profileTexture, metalness: 0.1, roughness: 0.4,
    emissive: 0xffffff, emissiveMap: profileTexture, emissiveIntensity: 1.0 
  })
);
profileCube.position.set(15, 5, 20);
scene.add(profileCube);
zoomableObjects.push(profileCube);

if (ENABLE_SPHERES) {
  const sphereGeo = new THREE.SphereGeometry(3, 24, 24);

  eye = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshStandardMaterial({
      map: tLoader.load('/textures/eye1.jpg'),
      normalMap: commonNormalMap
    })
  );
  eye.position.set(-20, 0, 90);

  cg = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshStandardMaterial({
      map: tLoader.load('/textures/cg.jpg'),
      normalMap: commonNormalMap
    })
  );
  cg.position.set(-24, 0, 110);

  scene.add(eye, cg);
  zoomableObjects.push(eye, cg);
}

// --- 9. POST PROCESSING ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.visibleEdgeColor.set('#00f2ff');
composer.addPass(outlinePass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth/4, window.innerHeight/4), 0.2, 1.0, 4.0));

// --- 10. INTERACTION ---
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  tooltip.style.transform = `translate(${e.clientX + 15}px, ${e.clientY + 15}px)`;
  needsRaycast = true;
});

window.addEventListener('click', () => {
  if (hoveredObject) {
    let target = hoveredObject;
    while(target.parent && !zoomableObjects.includes(target)) target = target.parent;
    zoomTargetPos.set(target.position.x, target.position.y, target.position.z + 10);
    isZoomed = true;
  }
});

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  defaultTargetZ = Math.max(4, 15 + t * -0.05);
  targetX = t * -0.0002;
  targetRotY = t * -0.0002;
  if (isZoomed) isZoomed = false; 
}
window.addEventListener('scroll', moveCamera, { passive: true });

// --- 11. ANIMATION ---
const scrollPos = new THREE.Vector3(); 
function animate() {
  requestAnimationFrame(animate);

  if (needsRaycast) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(zoomableObjects, true);
    if (intersects.length > 0) {
      let target = intersects[0].object;
      while(target.parent && !zoomableObjects.includes(target)) target = target.parent;
      if (hoveredObject !== target) {
        if (hoveredObject) { hoveredObject.scale.multiplyScalar(1 / 1.15); hoveredObject.updateMatrix(); }
        hoveredObject = target;
        outlinePass.selectedObjects = [hoveredObject];
        hoveredObject.scale.multiplyScalar(1.15); 
        hoveredObject.updateMatrix();
        document.body.style.cursor = 'pointer'; 
        if (hoveredObject.userData.name) {
            tooltip.innerText = hoveredObject.userData.name;
            tooltip.style.display = 'block';
        }
      }
    } else if (hoveredObject) {
      hoveredObject.scale.multiplyScalar(1 / 1.15);
      hoveredObject.updateMatrix();
      hoveredObject = null;
      outlinePass.selectedObjects = [];
      document.body.style.cursor = 'default';
      tooltip.style.display = 'none';
    }
    needsRaycast = false;
  }

  if (isZoomed) {
    camera.position.lerp(zoomTargetPos, 0.07);
  } else {
    scrollPos.set(targetX, 0, defaultTargetZ);
    camera.position.lerp(scrollPos, 0.07);
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.07;
  }

  if (baseModel) {
    baseModel.rotation.y = THREE.MathUtils.lerp(baseModel.rotation.y, mouse.x * 0.6, 0.1);
    baseModel.rotation.x = THREE.MathUtils.lerp(baseModel.rotation.x, -mouse.y * 0.3, 0.1);
    baseModel.updateMatrix();
  }

  profileCube.rotation.y += 0.003;
  profileCube.updateMatrix();
  if (eye) {
  eye.rotation.y += 0.002;
  eye.updateMatrix();
}

  stars.rotation.y += 0.0005;

  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});