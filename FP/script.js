let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 30);

const textureLoader = new THREE.TextureLoader();
const exrLoader = new THREE.EXRLoader();

let loader = new THREE.GLTFLoader();
loader.load('./assets/BantayoPoboide1.glb', function (gltf) {
    let object = gltf.scene;
    scene.add(object);
});

function loadGrass() {
    RepeatWrapping = THREE.RepeatWrapping;
    MeshStandardMaterial = THREE.MeshStandardMaterial;

    const colorMap = textureLoader.load('./assets/grass.jpg');
    const roughnessMap = textureLoader.load('./assets/grass_rough.jpg');
    const displacementMap = textureLoader.load('./assets/grass_disp.png');
    const normalMap = exrLoader.load('./assets/grass_normal.exr');

    const tileCount = 10; // Adjust this for more or less tiling
    colorMap.wrapS = colorMap.wrapT = RepeatWrapping;
    colorMap.repeat.set(tileCount, tileCount);
    
    displacementMap.wrapS = displacementMap.wrapT = RepeatWrapping;
    displacementMap.repeat.set(tileCount, tileCount);
    
    normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
    normalMap.repeat.set(tileCount, tileCount);
    
    roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;
    roughnessMap.repeat.set(tileCount, tileCount);

    const material = new MeshStandardMaterial({
        map: colorMap,
        displacementMap: displacementMap,
        displacementScale: 0.1,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
    });
    
    const geometry = new PlaneGeometry(100, 100, 256, 256); // Higher segments for better displacement
    const mesh = new Mesh(geometry, material);

    mesh.rotation.x = -Math.PI / 2;
    
    scene.add(mesh);
}

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

function setLighting(time) {
  scene.children = scene.children.filter(child => !(child.isLight));

  let ambientIntensity = 0.5;
  let directionalColor = 0xffffff;
  let directionalIntensity = 1.0;

  switch (time) {
      case 'morning':
          ambientIntensity = 0.3;
          directionalColor = 0xffdcb2;
          directionalIntensity = 0.8;
          break;
      case 'afternoon':
          ambientIntensity = 0.6;
          directionalColor = 0xffffff;
          directionalIntensity = 1.2;
          break;
      case 'night':
          ambientIntensity = 0.1;
          directionalColor = 0x4a5fba;
          directionalIntensity = 0.5;
          break;
  }

  let ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambientLight);

  let directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
  directionalLight.position.set(50, 100, -50);
  scene.add(directionalLight);
}

// Example: Set time to morning
setLighting('morning');


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

loadGrass();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
