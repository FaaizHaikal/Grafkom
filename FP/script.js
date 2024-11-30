import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

let scene, camera, renderer, controls, stats, gui;
let gltfLoader, textureLoader, exrLoader;

function initSky() {
    const sky = new Sky();
    sky.scale.setScalar( 10000 );
    scene.add( sky );

    const sun = new THREE.Vector3();

    const sunParameters = {
        turbidity: 0.1,
        rayleigh: 1.0,
        mieCoefficient: 0.045,
        mieDirectionalG: 0.988,
        elevation: 2,
		azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
	const sceneEnv = new THREE.Scene();

    let renderTarget;

    function updateSun() {
        const skyUniforms = sky.material.uniforms;

        skyUniforms[ 'turbidity' ].value = sunParameters.turbidity;
        skyUniforms[ 'rayleigh' ].value = sunParameters.rayleigh;
        skyUniforms[ 'mieCoefficient' ].value = sunParameters.mieCoefficient;
        skyUniforms[ 'mieDirectionalG' ].value = sunParameters.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - sunParameters.elevation );
        const theta = THREE.MathUtils.degToRad( sunParameters.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );

        if ( renderTarget !== undefined ) renderTarget.dispose();

        sceneEnv.add( sky );
        renderTarget = pmremGenerator.fromScene( sceneEnv );
        scene.add( sky );

        scene.environment = renderTarget.texture;
    }

    updateSun();

    const folderSky = gui.addFolder( 'Sky' );
    folderSky.add( sunParameters, 'turbidity', 0.0, 20.0, 0.1 ).onChange( updateSun );
    folderSky.add( sunParameters, 'rayleigh', 0.0, 4, 0.001 ).onChange( updateSun );
    folderSky.add( sunParameters, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( updateSun );
    folderSky.add( sunParameters, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( updateSun );
    folderSky.add( sunParameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
    folderSky.add( sunParameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
    folderSky.open();
}

function init() {
    const container = document.getElementById('container');
    
    // loader
    gltfLoader = new GLTFLoader();
    textureLoader = new THREE.TextureLoader();
    exrLoader = new EXRLoader();

    scene = new THREE.Scene();

    // renderer
    
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.235;
    container.appendChild( renderer.domElement );

    // camera
    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.set(0, 15, -50);

    // controls

    controls = new OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = false;
    controls.enableZoom = true;
    controls.maxDistance = 100;

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );
    
    gui = new GUI();

    initSky();

    function loadHouseModel() {
        gltfLoader.load('./assets/BantayoPoboide1.glb', function(gltf) {
            const model = gltf.scene;
            scene.add(model);
        });
    }

    loadHouseModel();

    function loadGround() {
        const RepeatWrapping = THREE.RepeatWrapping;
        const MeshStandardMaterial = THREE.MeshStandardMaterial;

        const colorMap = textureLoader.load('./assets/grass_color.jpg');
        const roughnessMap = textureLoader.load('./assets/grass_rough.jpg');
        const displacementMap = textureLoader.load('./assets/grass_disp.png');
        const normalMap = exrLoader.load('./assets/grass_normal.exr');

        const tileCount = 10;
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
            displacementScale: 1.0,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
        });
        
        const geometry = new THREE.PlaneGeometry(500, 500, 1024, 1024);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.rotation.x = -Math.PI / 2;
        
        scene.add(mesh);
    }

    loadGround();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    stats.update();
    render();
}

init();
