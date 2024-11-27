let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 30);

let loader = new THREE.GLTFLoader();
loader.load('./assets/BantayoPoboide1.glb', function (gltf) {
    let object = gltf.scene;
    scene.add(object);
});

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Ambient lighting
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Main light
directionalLight.position.set(100, 100, -100);
directionalLight.castShadow = true;
scene.add(directionalLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
