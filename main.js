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

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(500));

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
// Background video setup
function setBackgroundVideo(scene, videoUrl) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.load();
  video.muted = true;  // Mute the video for autoplay
  video.loop = true;   // Loop the video

  // Play the video after it has been loaded
  video.oncanplay = () => {
    video.play();
    console.log('Video is playing');
  };

  // Check if video is ready to be played
  video.onerror = () => {
    console.error('Error loading video');
  };

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter; // Prevent pixelation when the video is scaled
  videoTexture.magFilter = THREE.LinearFilter; // Prevent pixelation on zoom
  videoTexture.format = THREE.RGBFormat;

  scene.background = videoTexture; // Set the background to the video texture

  // Update the video texture on each frame
  function updateVideoTexture() {
    if (scene.background instanceof THREE.VideoTexture) {
      scene.background.needsUpdate = true;
    }
    requestAnimationFrame(updateVideoTexture);  // Keep updating the video texture
  }
  
  updateVideoTexture();  // Start the texture update loop
}

setBackgroundVideo(scene, 'drawing.mp4');

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
loader.load('/visual_studio_logo.glb', (gltf) => {
  const visualStudioModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  visualStudioModel.rotation.set(0, Math.PI, 0);

  // Scaling and positioning the model
  visualStudioModel.scale.set(0.5, 0.5, 0.5);
  visualStudioModel.position.set(-25, -5, 20); // Initial position

  // Make sure shadows are enabled if necessary
  visualStudioModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(visualStudioModel);

  // Animation variables for floating effect
  let floatTime = 0;

  function animateVisualStudio() {
    requestAnimationFrame(animateVisualStudio);

    // Apply the floating effect with sine wave motion
    visualStudioModel.position.y = -5 + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animateVisualStudio();
});

////

loader.load('/c++.glb', (gltf) => {
  const cModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  cModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  cModel.scale.set(0.05, 0.05, 0.05);
  cModel.position.set(-20, -5, 20); // Initial position

  // Make sure shadows are enabled if necessary
  cModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(cModel);

  // Animation variables for floating effect
  let floatTime = 0;

  function animatec() {
    requestAnimationFrame(animatec); // Corrected recursive call

    // Apply the floating effect with sine wave motion
    cModel.position.y = -5 + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatec();
});

/////
loader.load('/cc.glb', (gltf) => {
  const ccModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  ccModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  ccModel.scale.set(0.05, 0.05, 0.05);
  ccModel.position.set(-15, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  ccModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(ccModel);

  // Store the initial Y position to float around it
  const initialY = ccModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatec() {
    requestAnimationFrame(animatec); // Make sure to call animatec

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    ccModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatec();
});





loader.load('/pyth.glb', (gltf) => {
  const pythModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  pythModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  pythModel.scale.set(0.5, 0.5, 0.5);
  pythModel.position.set(-10, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  pythModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(pythModel);

  // Store the initial Y position to float around it
  const initialY = pythModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatepyth() {
    requestAnimationFrame(animatepyth); // Fixed to call animatepyth recursively

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    pythModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatepyth();
});



////
loader.load('/h.glb', (gltf) => {
  const hModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  hModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  hModel.scale.set(0.015, 0.015, 0.015);
  hModel.position.set(-5, -8, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  hModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(hModel);

  // Store the initial Y position to float around it
  const initialY = hModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animateh() {
    requestAnimationFrame(animateh); // Fixed to call animateh recursively

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    hModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animateh();
});

loader.load('/css.glb', (gltf) => {
  const cssModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  cssModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  cssModel.scale.set(0.015, 0.015, 0.015);
  cssModel.position.set(-0, -8, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  cssModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(cssModel);

  // Store the initial Y position to float around it
  const initialY = cssModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatecss() {
    requestAnimationFrame(animatecss); // Fixed to call animatecss recursively

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    cssModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatecss();
});

///

loader.load('/js.glb', (gltf) => {
  const jsModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  jsModel.rotation.set(-10,20,-20);

  // Scaling and positioning the model
  jsModel.scale.set(0.15, 0.15, 0.15);
  jsModel.position.set(4, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  jsModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(jsModel);

  // Store the initial Y position to float around it
  const initialY = jsModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatejs() {
    requestAnimationFrame(animatejs); // Fixed to call animatejs recursively

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    jsModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatejs();
});


//

loader.load('/react.glb', (gltf) => {
  const reactModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  reactModel.rotation.set(.25, Math.PI, 0);

  // Scaling and positioning the model
  reactModel.scale.set(0.5, 0.5, 0.5);
  reactModel.position.set(8, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  reactModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(reactModel);

  // Store the initial Y position to float around it
  const initialY = reactModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatereact() {
    requestAnimationFrame(animatereact); // Corrected recursive call

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    reactModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatereact();
});


///


loader.load('/figma.glb', (gltf) => {
  const figmaModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  figmaModel.rotation.set(0,0,0);

  // Scaling and positioning the model
  figmaModel.scale.set(1, 1, 1);
  figmaModel.position.set(14, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  figmaModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(figmaModel);

  // Store the initial Y position to float around it
  const initialY = figmaModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animatefigma() {
    requestAnimationFrame(animatefigma); // Corrected recursive call

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    figmaModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animatefigma();
});



loader.load('/blender.glb', (gltf) => {
  const blenderModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  blenderModel.rotation.set(.25, Math.PI, 0);

  // Scaling and positioning the model
  blenderModel.scale.set(1, 1, 1);
  blenderModel.position.set(11, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  blenderModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(blenderModel);

  // Store the initial Y position to float around it
  const initialY = blenderModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animateblender() {
    requestAnimationFrame(animateblender); // Corrected recursive call

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    blenderModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animateblender();
});


///
loader.load('/unity.glb', (gltf) => {
  const unityModel = gltf.scene;

  // Adjusting the rotation to ensure it's upright
  unityModel.rotation.set(1, Math.PI, 0);

  // Scaling and positioning the model
  unityModel.scale.set(.3, .3, .3);
  unityModel.position.set(17, -5, 20);  // Initial position

  // Make sure shadows are enabled if necessary
  unityModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the model to the scene
  scene.add(unityModel);

  // Store the initial Y position to float around it
  const initialY = unityModel.position.y;

  // Animation variables for floating effect
  let floatTime = 0;

  function animateunity() {
    requestAnimationFrame(animateunity); // Corrected recursive call

    // Apply the floating effect with sine wave motion, floating around the initial Y position
    unityModel.position.y = initialY + Math.sin(floatTime) * 2;

    // Increment time to animate
    floatTime += 0.02;

    // Re-render the scene
    composer.render();
  }

  // Start the floating animation
  animateunity();
});

///
///
//

loader.load('/sphere.glb', (gltf) => {
  model = gltf.scene;
  model.rotation.y = Math.PI/2;
  model.scale.set(5, 5, 5);
  model.position.set(10, -15, 120);
  
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,  // Set the base color to white
        emissive: 0x808080,  // Cyan emissive color (glow effect)
        emissiveIntensity: 1.5,  // Strength of the glow
        metalness: 0.5,
        roughness: 0.5,
      });
    }
  });

  scene.add(model);
});

///



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
  gamingSetup.position.set(25, -5, 30);
  gamingSetup.scale.set(5, 5, 5);
  gamingSetup.rotation.y = Math.PI;
  scene.add(gamingSetup);
});

// Textures for eye and cg
const eyeTexture = new THREE.TextureLoader().load('eye1.jpg');
const normalTexture = new THREE.TextureLoader().load('normal.jpg');

const eye = new THREE.Mesh(
  new THREE.SphereGeometry(3, 50, 50), // 
  new THREE.MeshStandardMaterial({
    map: eyeTexture,
    normalMap: normalTexture,
  })
);
scene.add(eye);
eye.position.set(-20, 0, 90);

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
cg.position.set(-24, 0, 110);

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
  .8,  
  1.0,  
  4.0
);
composer.addPass(bloomPass);

// Time variable for twinkling effect
let time = 0;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the eye setup model continuously
  if (eye) {
    eye.rotation.y += 0.005;
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
