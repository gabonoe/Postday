import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('canvas-container');

// Renderer with shadows and photorealistic settings
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.6, 6.5);

// Audio setup
const listener = new THREE.AudioListener();
camera.add(listener);

const audio = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

// Load audio file
audioLoader.load(
  'assets/sound/love.mp3',
  (buffer) => {
    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.5);
    try {
      audio.play();
    } catch (e) {
      console.log('Autoplay blocked by browser:', e);
    }
  },
  (progress) => {
    console.log('Audio loading:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
  },
  (error) => {
    console.error('Error loading audio:', error);
  }
);

// Lights tuned for photorealistic scene with shadows
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(1.5, 6, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 20;
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.000005;
keyLight.shadow.radius = 10;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xff9ecf, 0.7); // pink fill
fillLight.position.set(-4, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa86bff, 0.5); // purple rim
rimLight.position.set(0, 3, -4);
scene.add(rimLight);

// Shadow plane (invisible, only receives shadows)
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.ShadowMaterial({ opacity: 0.18, color: 0x401030 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.8;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.1;
controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 1.9;
controls.target.set(0, 0, 0);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

// Reference to Cylinder mesh for opacity animation
let cylinderMesh = null;

const loader = new GLTFLoader();
loader.load(
  'assets/3D/Caja.glb',
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.2 / maxDim;
    model.scale.setScalar(scale);

    // Enable shadows on model and all children, find Cylinder mesh
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Find Cylinder mesh by name or geometry type
        if (child.name.toLowerCase().includes('cylinder') ||
            child.geometry?.type === 'CylinderGeometry') {
          cylinderMesh = child;
          // Enable transparency for opacity animation
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1;
          }
        }
      }
    });

    modelGroup.add(model);
  },
  undefined,
  (err) => console.error('Error cargando Caja.glb:', err)
);

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(container);
window.addEventListener('resize', resize);
resize();

function animate() {
  controls.update();
  // Gentle floating motion
  modelGroup.position.y = -0.2 + Math.sin(performance.now() * 0.0012) * 0.06;

  // Cylinder opacity animation (fade in/out loop)
  if (cylinderMesh && cylinderMesh.material) {
    const time = performance.now() * 0.0015;
    const opacity = 0.3 + (Math.sin(time) * 0.5 + 0.5) * 0.7; // 0.3 to 1.0
    cylinderMesh.material.opacity = opacity;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
