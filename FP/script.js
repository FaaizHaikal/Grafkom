import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let scene, camera, renderer, controls, stats, gui;
let gltfLoader, textureLoader, exrLoader;
let sunLight;

function initSky(folderSky, advancedFolder) {
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
        sunLight.position.copy( sun.multiplyScalar( 100) );

        if ( renderTarget !== undefined ) renderTarget.dispose();

        sceneEnv.add( sky );
        renderTarget = pmremGenerator.fromScene( sceneEnv );
        scene.add( sky );

        scene.environment = renderTarget.texture;
    }

    updateSun();

    const timeOfDay = {
        noon: {
            rayleigh: 1.0,
            turbidity: 0.1,
            minCoefficient: 0.045,
            mieDirectionalG: 0.988, 
            elevation: 0, 
            azimuth: 180 
        },
        day: {
            rayleigh: 1.0,
            turbidity: 0.1,
            minCoefficient: 0.045,
            mieDirectionalG: 0.988, 
            elevation: 45, 
            azimuth: 180 
        },
        night: {
            rayleigh: 0.001,
            turbidity: 0.0,
            minCoefficient: 0.0,
            mieDirectionalG: 0.0,
            elevation: 15.0,
            azimuth: 180
        }
    };
    
    const timeOfDayParameters = { time: 'day' };
    
    function updateTimeOfDay() {
        const config = timeOfDay[timeOfDayParameters.time];
        sunParameters.turbidity = config.turbidity;
        sunParameters.rayleigh = config.rayleigh;
        sunParameters.mieCoefficient = config.minCoefficient;
        sunParameters.mieDirectionalG = config.mieDirectionalG;
        sunParameters.elevation = config.elevation;
        sunParameters.azimuth = config.azimuth;
        updateSun();

                
        if (folderSky.__controllers) {
            folderSky.__controllers.forEach(controller => controller.updateDisplay());
        }
    }

    updateTimeOfDay();

    advancedFolder.add( sunParameters, 'turbidity', 0.0, 20.0, 0.1 ).onChange( updateSun );
    advancedFolder.add( sunParameters, 'rayleigh', 0.0, 4, 0.001 ).onChange( updateSun );
    advancedFolder.add( sunParameters, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( updateSun );
    advancedFolder.add( sunParameters, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( updateSun );
    advancedFolder.close();
    folderSky.add( sunParameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
    folderSky.add( sunParameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
    folderSky.add(timeOfDayParameters, 'time', ['day', 'noon', 'night']).onChange(updateTimeOfDay);
    folderSky.open();
}

function initLight() {
    // directional sun light

    sunLight = new THREE.DirectionalLight(0xffffff, 0.1);
    sunLight.castShadow = true;
    
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    
    scene.add(sunLight);
}

function init() {
    const container = document.getElementById('container');

    function logCameraPosition() {
        console.log(`Camera Position: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
        console.log(`Camera Target: (${controls.target.x}, ${controls.target.y}, ${controls.target.z})`);
    }
    
    // Call logCameraPosition periodically or bind it to an event
    window.addEventListener('keydown', (event) => {
        if (event.key === 'l') { // Press "L" to log camera position and target
            logCameraPosition();
        }
    });
    
    // loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    gltfLoader = new GLTFLoader();

    gltfLoader.setDRACOLoader(dracoLoader);

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    const folderSky = gui.addFolder( 'Sky' );
    const advancedFolder = folderSky.addFolder( 'Advanced' );

    initLight();
    initSky(folderSky, advancedFolder);

    const foldercameratoggle = gui.addFolder('Toggle Camera');
    const toggleView = { inside: false };

    function toggleCameraView() {
        if (toggleView.inside) {
            // Set camera to inside view
            camera.position.set(-10, 7, 27); 
            controls.target.set(-3, 4, 23); 
        } else {
            // Set camera to outside view
            camera.position.set(0, 15, -50); 
            controls.target.set(0, 0, 0); 
        }

        controls.update();
    }

    // Add a toggle button to the GUI
    foldercameratoggle.add(toggleView, 'inside').name('Inside View').onChange(toggleCameraView);
    foldercameratoggle.open();

    const description = `
        <h2 style="font-size: 20px; margin: 0;">Bantayo Poboide</h2>
        <br />
        <p style="margin: 0;">This is a 3D model of a traditional house from the Bantayo Poboide tribe in Indonesia.</p>
    `;

    const div = document.createElement('div');
    div.innerHTML = description;
    div.style.padding = '10px'; // Add some padding for better readability

    gui.domElement.appendChild(div);

    function loadHouseModel() {
        gltfLoader.load('./assets/house.glb', function(gltf) {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true; // Allow the object to cast shadows
                    child.receiveShadow = true; // Allow the object to receive shadows (optional)
                }
            });

            model.position.y += 0.5;
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
        mesh.receiveShadow = true;

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
    console.log(`Camera Position: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
    console.log(`Camera Target: (${controls.target.x}, ${controls.target.y}, ${controls.target.z})`);
    render();
}

init();
