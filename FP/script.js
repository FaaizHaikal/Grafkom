let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

// load GLB File
let loader = new THREE.GLTFLoader();
let object;
loader.load('./assets/BantayoPoboide.glb', function(gltf){
  object = gltf.scene;
  scene.add(object);
});

camera.position.set(0, 0, 30);

let renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

let ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();