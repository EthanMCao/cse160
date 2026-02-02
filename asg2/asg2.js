// asg2.js

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngle = 0;

// mouse rotation
let g_mouseRotationX = 0;
let g_mouseRotationY = 0;
let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// animation
let g_animationOn = false;
let g_seconds = 0;

// poke animation
let g_pokeAnimation = false;
let g_pokeTime = 0;
let g_pokeYOffset = 0;

// joint angles
let g_headAngle = 0;
let g_legFLAngle = 0;
let g_legFRAngle = 0;
let g_legBLAngle = 0;
let g_legBRAngle = 0;
let g_trunkAngle = 0;
let g_trunkTipAngle = 0;
let g_earLAngle = 0;
let g_earRAngle = 0;
let g_tailAngle = 0;

// performance
let g_startTime = performance.now() / 1000.0;
let g_lastFrameTime = g_startTime;
let g_frameCount = 0;
let g_fps = 0;

let g_cubeVertices = null;
let g_sphereVertices = null;
let g_cylinderVertices = null;

// buffer objects
let g_cubeBuffer = null;
let g_sphereBuffer = null;
let g_cylinderBuffer = null;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  setupCubeBuffer();
  setupSphereBuffer();
  setupCylinderBuffer();
  
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.clearDepth(1.0);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  gl.depthMask(true);
  gl.clearColor(0.2, 0.3, 0.4, 1.0);
  
  registerUIEventHandlers();
  tick();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
  
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
}

function setupCubeBuffer() {
  g_cubeVertices = new Float32Array([
    // front
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // back
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    // top
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // bottom
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // right
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // left
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
  ]);
  
  // create buffer once
  g_cubeBuffer = gl.createBuffer();
  if (!g_cubeBuffer) {
    console.log('Failed to create cube buffer');
    return;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_cubeVertices, gl.STATIC_DRAW);
}

function setupSphereBuffer() {
  let vertices = [];
  let latitudeBands = 15;
  let longitudeBands = 15;
  
  for (let lat = 0; lat <= latitudeBands; lat++) {
    let theta = lat * Math.PI / latitudeBands;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= longitudeBands; lon++) {
      let phi = lon * 2 * Math.PI / longitudeBands;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);
      
      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;
      
      vertices.push(x * 0.5, y * 0.5, z * 0.5);
    }
  }
  
  let sphereVertices = [];
  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      let first = (lat * (longitudeBands + 1)) + lon;
      let second = first + longitudeBands + 1;
      
      sphereVertices.push(vertices[first * 3], vertices[first * 3 + 1], vertices[first * 3 + 2]);
      sphereVertices.push(vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2]);
      sphereVertices.push(vertices[(first + 1) * 3], vertices[(first + 1) * 3 + 1], vertices[(first + 1) * 3 + 2]);
      
      sphereVertices.push(vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2]);
      sphereVertices.push(vertices[(second + 1) * 3], vertices[(second + 1) * 3 + 1], vertices[(second + 1) * 3 + 2]);
      sphereVertices.push(vertices[(first + 1) * 3], vertices[(first + 1) * 3 + 1], vertices[(first + 1) * 3 + 2]);
    }
  }
  
  g_sphereVertices = new Float32Array(sphereVertices);
  
  // create buffer once
  g_sphereBuffer = gl.createBuffer();
  if (!g_sphereBuffer) {
    console.log('Failed to create sphere buffer');
    return;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_sphereVertices, gl.STATIC_DRAW);
}

function setupCylinderBuffer() {
  let cylinderVertices = [];
  let segments = 20;
  let radius = 0.5;
  
  for (let i = 0; i <= segments; i++) {
    let angle = (i * 2 * Math.PI) / segments;
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    
    if (i < segments) {
      let nextAngle = ((i + 1) * 2 * Math.PI) / segments;
      let nextX = Math.cos(nextAngle) * radius;
      let nextZ = Math.sin(nextAngle) * radius;
      
      cylinderVertices.push(x, -0.5, z);
      cylinderVertices.push(nextX, -0.5, nextZ);
      cylinderVertices.push(x, 0.5, z);
      
      cylinderVertices.push(nextX, -0.5, nextZ);
      cylinderVertices.push(nextX, 0.5, nextZ);
      cylinderVertices.push(x, 0.5, z);
    }
  }
  
  // top cap
  for (let i = 0; i < segments; i++) {
    let angle = (i * 2 * Math.PI) / segments;
    let nextAngle = ((i + 1) * 2 * Math.PI) / segments;
    let x1 = Math.cos(angle) * radius;
    let z1 = Math.sin(angle) * radius;
    let x2 = Math.cos(nextAngle) * radius;
    let z2 = Math.sin(nextAngle) * radius;
    
    cylinderVertices.push(0, 0.5, 0);
    cylinderVertices.push(x1, 0.5, z1);
    cylinderVertices.push(x2, 0.5, z2);
  }
  
  // bottom cap
  for (let i = 0; i < segments; i++) {
    let angle = (i * 2 * Math.PI) / segments;
    let nextAngle = ((i + 1) * 2 * Math.PI) / segments;
    let x1 = Math.cos(angle) * radius;
    let z1 = Math.sin(angle) * radius;
    let x2 = Math.cos(nextAngle) * radius;
    let z2 = Math.sin(nextAngle) * radius;
    
    cylinderVertices.push(0, -0.5, 0);
    cylinderVertices.push(x2, -0.5, z2);
    cylinderVertices.push(x1, -0.5, z1);
  }
  
  g_cylinderVertices = new Float32Array(cylinderVertices);
  
  // create buffer once
  g_cylinderBuffer = gl.createBuffer();
  if (!g_cylinderBuffer) {
    console.log('Failed to create cylinder buffer');
    return;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cylinderBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_cylinderVertices, gl.STATIC_DRAW);
}

function registerUIEventHandlers() {
  document.getElementById('angleSlider').addEventListener('input', function(ev) {
    g_globalAngle = this.value;
    document.getElementById('angleValue').innerHTML = this.value;
  });
  
  document.getElementById('animationOnButton').addEventListener('click', function() {
    g_animationOn = true;
  });
  document.getElementById('animationOffButton').addEventListener('click', function() {
    g_animationOn = false;
  });
  document.getElementById('pokeButton').addEventListener('click', function() {
    triggerPokeAnimation();
  });
  
  document.getElementById('legFLAngle').addEventListener('input', function(ev) {
    g_legFLAngle = this.value;
    document.getElementById('legFLValue').innerHTML = this.value;
  });
  document.getElementById('legFRAngle').addEventListener('input', function(ev) {
    g_legFRAngle = this.value;
    document.getElementById('legFRValue').innerHTML = this.value;
  });
  document.getElementById('legBLAngle').addEventListener('input', function(ev) {
    g_legBLAngle = this.value;
    document.getElementById('legBLValue').innerHTML = this.value;
  });
  document.getElementById('legBRAngle').addEventListener('input', function(ev) {
    g_legBRAngle = this.value;
    document.getElementById('legBRValue').innerHTML = this.value;
  });
  document.getElementById('trunkAngle').addEventListener('input', function(ev) {
    g_trunkAngle = this.value;
    document.getElementById('trunkValue').innerHTML = this.value;
  });
  document.getElementById('tailAngle').addEventListener('input', function(ev) {
    g_tailAngle = this.value;
    document.getElementById('tailValue').innerHTML = this.value;
  });
  
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      triggerPokeAnimation();
    } else {
      g_isDragging = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };
  
  canvas.onmousemove = function(ev) {
    if (g_isDragging) {
      let deltaX = ev.clientX - g_lastMouseX;
      let deltaY = ev.clientY - g_lastMouseY;
      
      g_mouseRotationY += deltaX * 0.5;
      g_mouseRotationX += deltaY * 0.5;
      
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };
  
  canvas.onmouseup = function(ev) {
    g_isDragging = false;
  };
  
  canvas.onmouseleave = function(ev) {
    g_isDragging = false;
  };
}

function triggerPokeAnimation() {
  g_pokeAnimation = true;
  g_pokeTime = 0;
}

function tick() {
  let currentTime = performance.now() / 1000.0;
  g_seconds = currentTime - g_startTime;
  
  g_frameCount++;
  if (currentTime - g_lastFrameTime >= 1.0) {
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFrameTime = currentTime;
    document.getElementById('performance').innerHTML = g_fps + ' FPS';
  }
  
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_pokeAnimation) {
    g_pokeTime += 0.015;
    
    if (g_pokeTime < 4.0) {
      let transitionTime = Math.min(g_pokeTime / 1.0, 1.0);
      let smoothFactor = transitionTime * transitionTime * (3.0 - 2.0 * transitionTime);
      
      g_pokeYOffset = -0.15 * smoothFactor;
      
      let targetLegAngle = -60;
      g_legFLAngle = g_legFLAngle * (1 - smoothFactor) + targetLegAngle * smoothFactor;
      g_legFRAngle = g_legFRAngle * (1 - smoothFactor) + targetLegAngle * smoothFactor;
      g_legBLAngle = g_legBLAngle * (1 - smoothFactor) + targetLegAngle * smoothFactor;
      g_legBRAngle = g_legBRAngle * (1 - smoothFactor) + targetLegAngle * smoothFactor;
      
      g_trunkAngle = 20 * smoothFactor;
      g_trunkTipAngle = -10 * smoothFactor;
      g_earLAngle = -15 * smoothFactor;
      g_earRAngle = -15 * smoothFactor;
      g_tailAngle = g_tailAngle * (1 - smoothFactor);
      g_headAngle = -15 * smoothFactor;
    } else {
      let returnTime = (g_pokeTime - 4.0) / 1.0;
      if (returnTime < 1.0) {
        let smoothFactor = 1.0 - (returnTime * returnTime * (3.0 - 2.0 * returnTime));
        
        g_pokeYOffset = -0.15 * smoothFactor;
        
        let targetLegAngle = -60;
        g_legFLAngle = targetLegAngle * smoothFactor;
        g_legFRAngle = targetLegAngle * smoothFactor;
        g_legBLAngle = targetLegAngle * smoothFactor;
        g_legBRAngle = targetLegAngle * smoothFactor;
        
        g_trunkAngle = 20 * smoothFactor;
        g_trunkTipAngle = -10 * smoothFactor;
        g_earLAngle = -15 * smoothFactor;
        g_earRAngle = -15 * smoothFactor;
        g_tailAngle = 0;
        g_headAngle = -15 * smoothFactor;
      } else {
        g_pokeAnimation = false;
        g_pokeTime = 0;
        g_pokeYOffset = 0;
      }
    }
  } else {
    g_pokeYOffset = 0;
    
    if (g_animationOn) {
      g_legFLAngle = 30 * Math.sin(g_seconds * 2);
      g_legFRAngle = 30 * Math.sin(g_seconds * 2 + Math.PI);
      g_legBLAngle = 30 * Math.sin(g_seconds * 2 + Math.PI);
      g_legBRAngle = 30 * Math.sin(g_seconds * 2);
      
      g_trunkAngle = 15 * Math.sin(g_seconds * 1.5);
      g_trunkTipAngle = 15 * Math.sin(g_seconds * 1.5 + 0.5);
      
      g_earLAngle = 15 * Math.sin(g_seconds * 3);
      g_earRAngle = 15 * Math.sin(g_seconds * 3 + Math.PI);
      
      g_tailAngle = 25 * Math.sin(g_seconds * 2.5);
      
      g_headAngle = 10 * Math.sin(g_seconds * 1.2);
    }
  }
}

function renderScene() {
  gl.clearColor(0.2, 0.3, 0.4, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  
  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_mouseRotationX, 1, 0, 0);
  globalRotMat.rotate(g_mouseRotationY, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  drawElephant();
}

function drawElephant() {
  // body
  let bodyMat = new Matrix4();
  bodyMat.translate(0, -0.1 + g_pokeYOffset, 0);
  let bodyCoord = new Matrix4(bodyMat);
  bodyMat.scale(0.6, 0.4, 0.4);
  drawCube(bodyMat, [0.7, 0.7, 0.7, 1.0]);
  
  // head
  let headMat = new Matrix4(bodyCoord);
  headMat.translate(0.32, 0.05, 0);
  headMat.rotate(g_headAngle, 0, 0, 1);
  let headCoord = new Matrix4(headMat);
  headMat.translate(0.1, 0.05, 0);
  headMat.scale(0.28, 0.28, 0.28);
  drawCube(headMat, [0.7, 0.7, 0.7, 1.0]);
  
  // trunk base
  let trunkMat = new Matrix4(headCoord);
  trunkMat.translate(0.22, 0, 0);
  trunkMat.rotate(g_trunkAngle, 0, 0, 1);
  trunkMat.rotate(-75, 0, 0, 1);
  let trunkCoord = new Matrix4(trunkMat);
  trunkMat.translate(0.08, 0, 0);
  trunkMat.scale(0.16, 0.08, 0.08);
  drawCube(trunkMat, [0.6, 0.6, 0.6, 1.0]);
  
  // trunk middle
  let trunkMidMat = new Matrix4(trunkCoord);
  trunkMidMat.translate(0.16, 0, 0);
  trunkMidMat.rotate(15, 0, 0, 1);
  let trunkMidCoord = new Matrix4(trunkMidMat);
  trunkMidMat.translate(0.08, 0, 0);
  trunkMidMat.scale(0.16, 0.075, 0.075);
  drawCube(trunkMidMat, [0.6, 0.6, 0.6, 1.0]);
  
  // trunk tip
  let trunkTipMat = new Matrix4(trunkMidCoord);
  trunkTipMat.translate(0.16, 0, 0);
  trunkTipMat.rotate(g_trunkTipAngle + 35, 0, 0, 1);
  trunkTipMat.translate(0.08, 0, 0);
  trunkTipMat.scale(0.16, 0.07, 0.07);
  drawCube(trunkTipMat, [0.55, 0.55, 0.55, 1.0]);
  
  // left ear
  let earLMat = new Matrix4(headCoord);
  earLMat.translate(0.1, 0.2, -0.18);
  earLMat.rotate(g_earLAngle, 1, 0, 0);
  earLMat.scale(0.05, 0.2, 0.15);
  drawCube(earLMat, [0.65, 0.65, 0.65, 1.0]);
  
  // right ear
  let earRMat = new Matrix4(headCoord);
  earRMat.translate(0.1, 0.2, 0.18);
  earRMat.rotate(g_earRAngle, 1, 0, 0);
  earRMat.scale(0.05, 0.2, 0.15);
  drawCube(earRMat, [0.65, 0.65, 0.65, 1.0]);
  
  // tail
  let tailMat = new Matrix4(bodyCoord);
  tailMat.translate(-0.29, -0.05, 0);
  tailMat.rotate(g_tailAngle, 0, 0, 1);
  tailMat.translate(-0.06, 0, 0);
  tailMat.scale(0.12, 0.04, 0.04);
  drawCube(tailMat, [0.6, 0.6, 0.6, 1.0]);
  
  // front left leg
  let legFLMat = new Matrix4(bodyCoord);
  legFLMat.translate(0.2, -0.2, -0.15);
  legFLMat.rotate(g_legFLAngle, 0, 0, 1);
  legFLMat.translate(0, -0.15, 0);
  legFLMat.scale(0.08, 0.3, 0.08);
  drawCylinder(legFLMat, [0.65, 0.65, 0.65, 1.0]);
  
  // front right leg
  let legFRMat = new Matrix4(bodyCoord);
  legFRMat.translate(0.2, -0.2, 0.15);
  legFRMat.rotate(g_legFRAngle, 0, 0, 1);
  legFRMat.translate(0, -0.15, 0);
  legFRMat.scale(0.08, 0.3, 0.08);
  drawCylinder(legFRMat, [0.65, 0.65, 0.65, 1.0]);
  
  // back left leg
  let legBLMat = new Matrix4(bodyCoord);
  legBLMat.translate(-0.2, -0.2, -0.15);
  legBLMat.rotate(g_legBLAngle, 0, 0, 1);
  legBLMat.translate(0, -0.15, 0);
  legBLMat.scale(0.08, 0.3, 0.08);
  drawCylinder(legBLMat, [0.65, 0.65, 0.65, 1.0]);
  
  // back right leg
  let legBRMat = new Matrix4(bodyCoord);
  legBRMat.translate(-0.2, -0.2, 0.15);
  legBRMat.rotate(g_legBRAngle, 0, 0, 1);
  legBRMat.translate(0, -0.15, 0);
  legBRMat.scale(0.08, 0.3, 0.08);
  drawCylinder(legBRMat, [0.65, 0.65, 0.65, 1.0]);
}

function drawCube(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  
  // reuse existing buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawSphere(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  
  // reuse existing buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, g_sphereVertices.length / 3);
}

function drawCylinder(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  
  // reuse existing buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cylinderBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, g_cylinderVertices.length / 3);
}
