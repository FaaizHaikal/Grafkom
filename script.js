"use strict";

// Default values
var objectShape = "CUBE";
var objectMass = 1.0;

var appliedForce = 1.0;
var trajectory = "STRAIGHT";

var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);

var numPositions = 36;
var vertices = [
  vec4(-0.5, -0.5,  0.5, 1.0),
  vec4(-0.5,  0.5,  0.5, 1.0),
  vec4(0.5,  0.5,  0.5, 1.0),
  vec4(0.5, -0.5,  0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5,  0.5, -0.5, 1.0),
  vec4(0.5,  0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
  vec4(1.0, 0.0, 0.0, 1.0),  // Red
  vec4(0.0, 1.0, 0.0, 1.0),  // Green
  vec4(0.0, 0.0, 1.0, 1.0),  // Blue
  vec4(1.0, 1.0, 0.0, 1.0),  // Yellow
  vec4(1.0, 0.0, 1.0, 1.0),  // Magenta
  vec4(0.0, 1.0, 1.0, 1.0),  // Cyan
  vec4(0.5, 0.0, 0.0, 1.0),  // Dark Red
  vec4(0.0, 0.5, 0.0, 1.0),  // Dark Green
  vec4(0.0, 0.0, 0.5, 1.0),  // Dark Blue
  vec4(0.5, 0.5, 0.0, 1.0),  // Olive
  vec4(0.5, 0.0, 0.5, 1.0),  // Purple
  vec4(0.0, 0.5, 0.5, 1.0),  // Teal
  vec4(0.75, 0.25, 0.0, 1.0), // Brown
  vec4(0.25, 0.75, 0.0, 1.0), // Lime
  vec4(0.0, 0.25, 0.75, 1.0), // Sky Blue
  vec4(0.75, 0.0, 0.25, 1.0), // Maroon
  vec4(0.25, 0.0, 0.75, 1.0), // Indigo
  vec4(0.75, 0.75, 0.75, 1.0), // Light Gray
  vec4(0.25, 0.25, 0.25, 1.0), // Dark Gray
  vec4(0.5, 0.5, 0.5, 1.0)   // Gray
];
var colorIndex = 0;

var gl;
var canvas;
var positionsArray = [];
var colorsArray = [];

var near = 0.3;
var far = 30.0;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;

  return vec4(r, g, b, 1.0);
}

function penta(a, b, c, d, e) {
  const indices = [a, b, c, a, c, d, a, d, e];

  for (let i = 0; i < indices.length; i++) {
    positionsArray.push(vertices[indices[i]]);
    colorsArray.push(vertexColors[colorIndex]);
  }

  colorIndex++;
}

function quad(a, b, c, d) {
  var indices = [a, b, c, a, c, d];

  for (var i = 0; i < indices.length; i++) {
    positionsArray.push(vertices[indices[i]]);
    colorsArray.push(vertexColors[colorIndex]);
  }

  colorIndex++;
}

function colorDodecahedron()
{
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

function colorCube()
{
  colorIndex = 0;
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

function initializeInputListeners() {
  document.getElementById("objectOptions").addEventListener("click", function() {
    objectShape = this.value;

    switch (objectShape) {
      case "CUBE":
        numPositions = 36;
        vertices = [
          vec4(-0.5, -0.5,  0.5, 1.0),
          vec4(-0.5,  0.5,  0.5, 1.0),
          vec4(0.5,  0.5,  0.5, 1.0),
          vec4(0.5, -0.5,  0.5, 1.0),
          vec4(-0.5, -0.5, -0.5, 1.0),
          vec4(-0.5,  0.5, -0.5, 1.0),
          vec4(0.5,  0.5, -0.5, 1.0),
          vec4(0.5, -0.5, -0.5, 1.0)
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
          vec4(-A, 0, -B, 1.0)
        ];
        
        break;
    }

    positionsArray = [];
    colorsArray = [];

    init();
  });

  document.getElementById("increaseTheta").addEventListener("click", function() {
    theta += dr;
  });

  document.getElementById("decreaseTheta").addEventListener("click", function() {
    theta -= dr;
  });

  document.getElementById("increasePhi").addEventListener("click", function() {
    phi += dr;
  });

  document.getElementById("decreasePhi").addEventListener("click", function() {
    phi -= dr;
  });

  document.getElementById("increaseR").addEventListener("click", function() {
    radius *= 2.0;
  });

  document.getElementById("decreaseR").addEventListener("click", function() {
    radius *= 0.5;
  });

  document.getElementById("increaseZ").addEventListener("click", function() {
    near *= 1.1;
    far *= 1.1;
  });

  document.getElementById("decreaseZ").addEventListener("click", function() {
    near *= 0.9;
    far *= 0.9;
  });
}

function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  switch (objectShape) {
    case "CUBE":
      colorCube();
      break;
    case "DODECAHEDRON":
      colorDodecahedron();
      break;
  }

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

  render();
}

function render(){
  setTimeout( function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
               radius*Math.sin(theta)*Math.sin(phi), 
               radius*Math.cos(theta));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(-4.0, 4.0, -4.0, 4.0, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
  }, 60);
}



initializeInputListeners();
init();