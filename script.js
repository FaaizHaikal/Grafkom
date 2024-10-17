"use strict";
var program;

// Default values
var objectShape = "CUBE";
var objectMass = 500.0;

var animateForce = false;
var throwAngle = 60.0;
var velocity = 5.0;
var appliedForce = 1.0;
var trajectory = "STRAIGHT";
var autoRotate = false;

// Phong lighting properties
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
// Light position
var lightX = 1.0;
var lightY = 1.0;
var lightZ = 1.0;
var lightPosition = vec4(lightX, lightY, lightZ, 0.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 10.0;

var numPositions = 36;
var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0),
];

var vertexColors = [
  vec4(1.0, 0.0, 0.0, 1.0), // Red
  vec4(0.0, 1.0, 0.0, 1.0), // Green
  vec4(0.0, 0.0, 1.0, 1.0), // Blue
  vec4(1.0, 1.0, 0.0, 1.0), // Yellow
  vec4(1.0, 0.0, 1.0, 1.0), // Magenta
  vec4(0.0, 1.0, 1.0, 1.0), // Cyan
  vec4(0.5, 0.0, 0.0, 1.0), // Dark Red
  vec4(0.0, 0.5, 0.0, 1.0), // Dark Green
  vec4(0.0, 0.0, 0.5, 1.0), // Dark Blue
  vec4(0.5, 0.5, 0.0, 1.0), // Olive
  vec4(0.5, 0.0, 0.5, 1.0), // Purple
  vec4(0.0, 0.5, 0.5, 1.0), // Teal
  vec4(0.75, 0.25, 0.0, 1.0), // Brown
  vec4(0.25, 0.75, 0.0, 1.0), // Lime
  vec4(0.0, 0.25, 0.75, 1.0), // Sky Blue
  vec4(0.75, 0.0, 0.25, 1.0), // Maroon
  vec4(0.25, 0.0, 0.75, 1.0), // Indigo
  vec4(0.75, 0.75, 0.75, 1.0), // Light Gray
  vec4(0.25, 0.25, 0.25, 1.0), // Dark Gray
  vec4(0.5, 0.5, 0.5, 1.0), // Gray
];

var colorIndex = 0;

var gl;
var canvas = document.getElementById("gl-canvas");
var positionsArray = [];
var colorsArray = [];
var normalsArray = [];

var near = 0.3;
var far = 30.0;
var aspect = canvas.width / canvas.height;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;

var nMatrix, nMatrixLoc;

var modelViewMatrix, projectionMatrix;

var cubeSize = 16;
var dodecahedronSize = 32;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var translation = vec4(0.0, 0.0, 0.0, 1.0);

function resetTranslation() {
  switch (objectShape) {
    case "CUBE":
      switch (trajectory) {
        case "PARABOLA":
          translation = vec4(-cubeSize + 1, -cubeSize / 4.0 - 0.2, 0.0, 1.0);
          break;
        case "STRAIGHT":
          translation = vec4(-cubeSize + 1, 0.0, 0.0, 1.0);
          break;
      }

      break;
    case "DODECAHEDRON":
      switch (trajectory) {
        case "PARABOLA":
          translation = vec4(-dodecahedronSize + 2, -dodecahedronSize / 4 + 1.2, 0.0, 1.0);
          break;
        case "STRAIGHT":
          translation = vec4(-dodecahedronSize + 2, 0.0, 0.0, 1.0);
          break;
      }
      break;
  }

  initialStart = true;
}

function objectOut() {
  if (objectShape === "CUBE") {
    return (
      Math.abs(translation[0]) > cubeSize - 1 || Math.abs(translation[1]) > cubeSize / 4.0 + 0.2
    );
  }

  return (
    Math.abs(translation[0]) > dodecahedronSize - 2 || Math.abs(translation[1]) > dodecahedronSize / 4.0 + 1.2
  );
}

var startTime = 0;
var initialStart = true;

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;

  return vec4(r, g, b, 1.0);
}

function penta(a, b, c, d, e) {
  var indices = [a, b, c, a, c, d, a, d, e];

  // Compute two edge vectors of the pentagon to calculate the normal
  var t1 = subtract(vertices[b], vertices[a]); // First edge: a -> b
  var t2 = subtract(vertices[c], vertices[a]); // Second edge: a -> c

  // Calculate the normal of the face using the cross product
  var normal = cross(t1, t2);
  normal = vec3(normal); // Convert to vec3
  // normal = normalize(normal); // Uncomment if you need to normalize it

  // Loop through indices to push positions, colors, and normals
  for (var i = 0; i < indices.length; i++) {
    positionsArray.push(vertices[indices[i]]); // Push vertex position
    colorsArray.push(vertexColors[colorIndex]); // Push vertex color

    // Add the normal for each vertex (same normal for the entire face)
    normalsArray.push(normal);
  }

  // Increment color index for the next face
  colorIndex++;
}

function quad(a, b, c, d) {
  var indices = [a, b, c, a, c, d];

  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = cross(t1, t2);
  normal = vec3(normal);

  for (var i = 0; i < indices.length; i++) {
    positionsArray.push(vertices[indices[i]]);
    colorsArray.push(vertexColors[colorIndex]);

    // Add normal for each vertex
    normalsArray.push(normal);
  }

  colorIndex++;
}

function colorDodecahedron() {
  colorIndex = 0;

  penta(0, 16, 2, 10, 8);
  penta(0, 8, 4, 14, 12);
  penta(16, 17, 1, 12, 0);
  penta(1, 9, 11, 3, 17);
  penta(1, 12, 14, 5, 9);
  penta(2, 13, 15, 6, 10);
  penta(13, 3, 17, 16, 2);
  penta(3, 11, 7, 15, 13);
  penta(4, 8, 10, 6, 18);
  penta(14, 5, 19, 18, 4);
  penta(5, 19, 7, 11, 9);
  penta(15, 7, 19, 18, 6);
}

function colorCube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

function initializeInputListeners() {
  document.getElementById("objectOptions").onclick = function () {
    objectShape = this.value;

    switch (objectShape) {
      case "CUBE":
        numPositions = 36;
        vertices = [
          vec4(-0.5, -0.5, 0.5, 1.0),
          vec4(-0.5, 0.5, 0.5, 1.0),
          vec4(0.5, 0.5, 0.5, 1.0),
          vec4(0.5, -0.5, 0.5, 1.0),
          vec4(-0.5, -0.5, -0.5, 1.0),
          vec4(-0.5, 0.5, -0.5, 1.0),
          vec4(0.5, 0.5, -0.5, 1.0),
          vec4(0.5, -0.5, -0.5, 1.0),
        ];

        break;
      case "DODECAHEDRON":
        numPositions = 108;

        const A = (1 + Math.sqrt(5)) / 2; // The golden ratio
        const B = 1 / A;
        vertices = [
          vec4(1, 1, 1, 1.0),
          vec4(1, 1, -1, 1.0),
          vec4(1, -1, 1, 1.0),
          vec4(1, -1, -1, 1.0),
          vec4(-1, 1, 1, 1.0),
          vec4(-1, 1, -1, 1.0),
          vec4(-1, -1, 1, 1.0),
          vec4(-1, -1, -1, 1.0),
          vec4(0, B, A, 1.0),
          vec4(0, B, -A, 1.0),
          vec4(0, -B, A, 1.0),
          vec4(0, -B, -A, 1.0),
          vec4(B, A, 0, 1.0),
          vec4(B, -A, 0, 1.0),
          vec4(-B, A, 0, 1.0),
          vec4(-B, -A, 0, 1.0),
          vec4(A, 0, B, 1.0),
          vec4(A, 0, -B, 1.0),
          vec4(-A, 0, B, 1.0),
          vec4(-A, 0, -B, 1.0),
        ];

        break;
    }

    positionsArray = [];
    colorsArray = [];

    init();
  };

  document.getElementById("trajectoryOptions").onclick = function () {
    trajectory = this.value;

    if (trajectory === "PARABOLA") {
      document.getElementById("parabola-control").classList.remove("hidden");
      document.getElementById("straight-control").classList.add("hidden");
    } else {
      document.getElementById("parabola-control").classList.add("hidden");
      document.getElementById("straight-control").classList.remove("hidden");
    }

    resetTranslation();
  };

  document.getElementById("objectSize").oninput = function () {
    var value = parseFloat(this.value);
    if (value < 5) {
      value = 1 + (5 - value) / 5;
    } else {
      value = 1 - (value - 5) / 5;
    }

    if (value === 0) {
      value = 0.1;
    }
    switch (objectShape) {
      case "CUBE":
        cubeSize = 16 * value;
        projectionMatrix = ortho(-cubeSize, cubeSize, -cubeSize / aspect, cubeSize / aspect, near, far);
        break;
      case "DODECAHEDRON":
        dodecahedronSize = 32 * value;
        projectionMatrix = ortho(-dodecahedronSize, dodecahedronSize, -dodecahedronSize / aspect, dodecahedronSize / aspect, near, far);
        break;
    }

    resetTranslation();
  }

  document.getElementById("autoRotate").onclick = function () {
    autoRotate = this.checked;
    document.getElementById("increaseTheta").disabled = this.checked;
    document.getElementById("decreaseTheta").disabled = this.checked;
    document.getElementById("increasePhi").disabled = this.checked;
    document.getElementById("decreasePhi").disabled = this.checked;
  };

  document.getElementById("increaseTheta").onclick = function () {
    theta += dr;
  };

  document.getElementById("decreaseTheta").onclick = function () {
    theta -= dr;
  };

  document.getElementById("increasePhi").onclick = function () {
    phi += dr;
  };

  document.getElementById("decreasePhi").onclick = function () {
    phi -= dr;
  };

  document.getElementById("increaseR").onclick = function () {
    radius *= 2.0;
  };

  document.getElementById("decreaseR").onclick = function () {
    radius *= 0.5;
  };

  document.getElementById("increaseZ").onclick = function () {
    near *= 1.1;
    far *= 1.1;
    updateProjectionMatrix();
  };

  document.getElementById("decreaseZ").onclick = function () {
    near *= 0.9;
    far *= 0.9;
    updateProjectionMatrix();
  };

  function updateProjectionMatrix() {
    switch (objectShape) {
      case "CUBE":
        projectionMatrix = ortho(-cubeSize, cubeSize, -cubeSize / aspect, cubeSize / aspect, near, far);
        break;
      case "DODECAHEDRON":
        projectionMatrix = ortho(-dodecahedronSize, dodecahedronSize, -dodecahedronSize / aspect, dodecahedronSize / aspect, near, far);
        break;
    }
  }

  // Lighting control - Real-time updates
  document.getElementById("lightAmbient").oninput = function () {
    lightAmbient = hexToVec4(this.value);
  };

  document.getElementById("lightDiffuse").oninput = function () {
    lightDiffuse = hexToVec4(this.value);
  };

  document.getElementById("lightSpecular").oninput = function () {
    lightSpecular = hexToVec4(this.value);
  };

  // Light Position control
  document.getElementById("lightX").oninput = function () {
    lightX = parseFloat(this.value);
    updateLightPosition();
  };

  document.getElementById("lightY").oninput = function () {
    lightY = parseFloat(this.value);
    updateLightPosition();
  };

  document.getElementById("lightZ").oninput = function () {
    lightZ = parseFloat(this.value);
    updateLightPosition();
  };

  function updateLightPosition() {
    lightPosition = vec4(lightX, lightY, lightZ, 1.0);
  }

  document.getElementById("force").oninput = function () {
    appliedForce = parseFloat(this.value);
  };

  document.getElementById("throwAngle").oninput = function () {
    throwAngle = parseFloat(this.value);
  };

  document.getElementById("velocity").oninput = function () {
    velocity = parseFloat(this.value);
  };

  document.getElementById("objectMass").oninput = function () {
    objectMass = parseFloat(this.value);
  };

  document.getElementById("start").onclick = function () {
    animateForce = true;
  };

  document.getElementById("stop").onclick = function () {
    animateForce = false;
    resetTranslation();
  };
}

function init() {
  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  switch (objectShape) {
    case "CUBE":
      normalsArray = [];
      colorCube();
      projectionMatrix = ortho(-cubeSize, cubeSize, -cubeSize / aspect, cubeSize / aspect, near, far);
      break;
    case "DODECAHEDRON":
      normalsArray = [];
      colorDodecahedron();
      projectionMatrix = ortho(-dodecahedronSize, dodecahedronSize, -dodecahedronSize / aspect, dodecahedronSize / aspect, near, far);
      break;
  }

  // Color Buffer
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Normal Buffer
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var normalLoc = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  // Position Buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Uniform locations
  nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
  resetTranslation();

  animate(0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function autoRotateObject() {
  var random = Math.random() * 0.1;

  theta += random * dr;
  phi = Math.PI / 4;
}

function updatePosition(time) {
  if (initialStart) {
    startTime = time;
    initialStart = false;

    return;
  }

  var dt = (time - startTime);

  if (objectOut()) {
    resetTranslation();
  }

  switch (trajectory) {
    case "STRAIGHT":
      var acceleration = appliedForce / objectMass;
      acceleration /= 10000;

      translation[0] += 0.5 * acceleration * dt * dt;

      break;
    case "PARABOLA":
      const GRAVITY = 0.005; // Adjusted gravity constant

      var x = velocity * Math.cos((throwAngle * Math.PI) / 180) * dt;
      var y = (velocity * Math.sin((throwAngle * Math.PI) / 180) - GRAVITY * dt) * dt;

      translation[0] += x / 10000;
      translation[1] += y / 10000;

      break;
  }
}

function animate(time) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta)
  );
  modelViewMatrix = lookAt(eye, at, up);

  // Calculate and pass the normal matrix
  nMatrix = normalMatrix(modelViewMatrix, true);
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));

  // Set the lighting and material properties
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  if (animateForce) {
    updatePosition(time);
  }

  if (autoRotate) {
    autoRotateObject();
  }

  var translationMatrix = translate(
    translation[0],
    translation[1],
    translation[2]
  );
  modelViewMatrix = mult(translationMatrix, modelViewMatrix);

  // Send the lighting and material properties to the shader program
  gl.uniform4fv(
    gl.getUniformLocation(program, "uAmbientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uDiffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uSpecularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uLightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "uModelViewMatrix"),
    false,
    flatten(modelViewMatrix)
  );
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "uProjectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  gl.drawArrays(gl.TRIANGLES, 0, numPositions);

  window.requestAnimationFrame(animate);
}

initializeInputListeners();
init();
