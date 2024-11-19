let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let directionalLight = new THREE.DirectionalLight(0xffffff, 5.0); 
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
const geography = textureLoader.load('./assets/earth_geography.jpg');
const topography = textureLoader.load('./assets/earth_topography.jpg');
const clouds = textureLoader.load('./assets/clouds.png');
const ocean = textureLoader.load('./assets/oceans.png');
const nightLight = textureLoader.load('./assets/night_light.png');

const earthGroup = new THREE.Group();

const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
const earthMaterial = new THREE.MeshStandardMaterial({
  map: geography,
  bumpMap: topography,
  bumpScale: 0.05,
  roughnessMap: ocean,
  emissiveMap: nightLight,
  emissive: new THREE.Color(0xffff88),
  emissiveIntensity: 2.0,
});

const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
earthGroup.add(earthMesh);


// Clouds Material
const cloudsGeometry = new THREE.SphereGeometry(5.05, 64, 64);
const cloudsMaterial = new THREE.MeshStandardMaterial({
  map: clouds,
  transparent: true,
  opacity: 0.8,
});
const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
earthGroup.add(cloudsMesh);

// Atmosphere Material
const atmosphereMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: `
    varying vec3 vNormalAtmosphere;
    void main() {
      vNormalAtmosphere = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormalAtmosphere;
    void main() {
      // Soft blue glow for atmosphere
      float intensity = pow(0.7 - dot(vNormalAtmosphere, vec3(0, 0, 1.0)), 3.0);
      gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
  `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
});

const atmosphereGeometry = new THREE.SphereGeometry(5.5, 64, 64);
const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
earthGroup.add(atmosphereMesh);
earthGroup.rotation.z = 23.5 / 360 * 2 * Math.PI;
scene.add(earthGroup);

earthMaterial.onBeforeCompile = function(shader) {
  shader.uniforms.tClouds = { value: clouds }; // Cloud texture
  shader.uniforms.tClouds.value.wrapS = THREE.RepeatWrapping;
  shader.uniforms.uv_xOffset = { value: 0 };

  // Extend the existing vertex shader code
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `
      #include <common>
      varying vec2 vRoughnessMapUv;
      varying vec2 vEmissiveMapUv;
      varying vec2 vMapUv;
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    'void main() {',
    `
      void main() {
        vRoughnessMapUv = uv;  // Pass texture coordinates for roughness map
        vEmissiveMapUv = uv;   // Pass texture coordinates for emissive map
        vMapUv = uv;           // Pass texture coordinates for the Earth map
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    `gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);`
  );

  // Modify the fragment shader to handle these UVs and apply the effects
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
    #include <common>
    uniform sampler2D tClouds;
    uniform float uv_xOffset;
    varying vec2 vRoughnessMapUv;
    varying vec2 vEmissiveMapUv;
    varying vec2 vMapUv;
  `);

  shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
    float roughnessFactor = roughness;

    #ifdef USE_ROUGHNESSMAP
      vec4 texelRoughness = texture2D(roughnessMap, vRoughnessMapUv);
      texelRoughness = vec4(1.0) - texelRoughness;
      roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
    #endif
  `);

  shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
    #ifdef USE_EMISSIVEMAP
      vec4 emissiveColor = texture2D(emissiveMap, vEmissiveMapUv);

      // Calculate the emissive effect based on the light direction (day/night sides)
      emissiveColor *= 1.0 - smoothstep(-0.1, 0.0, dot(geometryNormal, directionalLights[0].direction));

      totalEmissiveRadiance *= emissiveColor.rgb;
    #endif

    // Cloud shadow calculations
    float cloudsMapValue = texture2D(tClouds, vec2(vMapUv.x - uv_xOffset, vMapUv.y)).r;
    diffuseColor.rgb *= max(1.0 - cloudsMapValue, 0.2);

    // Adding small atmospheric glow effect for realism
    float intensity = 1.4 - dot(geometryNormal, vec3(0.0, 0.0, 1.0));
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 5.0);
    diffuseColor.rgb += atmosphere;
  `);

  // Save the shader to update uniforms during the render loop
  earthMaterial.userData.shader = shader;
};


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.minDistance = 10;
controls.maxDistance = 50;

function animate() {
  requestAnimationFrame(animate);

  earthMesh.rotation.y += 0.0007;

  cloudsMesh.rotation.y += 0.001;

  renderer.render(scene, camera);
}

animate();
