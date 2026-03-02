// asg4.js

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute float a_texColorWeight;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ModelMatrix;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
    v_UV = a_UV;
    v_Color = a_Color;
    v_texColorWeight = a_texColorWeight;
    v_Normal = normalize(mat3(u_ModelMatrix) * a_Normal);
    v_WorldPos = worldPos.xyz;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;

  uniform sampler2D u_Sampler0;
  uniform bool u_LightingOn;
  uniform bool u_NormalVizOn;

  // point light
  uniform vec3 u_LightPos;
  uniform vec3 u_LightColor;
  uniform bool u_PointLightOn;

  // spotlight
  uniform vec3 u_SpotLightPos;
  uniform vec3 u_SpotLightDir;
  uniform float u_SpotLightCutoff;
  uniform vec3 u_SpotLightColor;
  uniform bool u_SpotLightOn;

  uniform vec3 u_CameraPos;

  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  void main() {
    vec3 normal = normalize(v_Normal);

    // normal visualization mode
    if (u_NormalVizOn) {
      gl_FragColor = vec4((normal + 1.0) / 2.0, 1.0);
      return;
    }

    // base color from texture/color blend
    float t = v_texColorWeight;
    vec4 baseColor = (1.0 - t) * v_Color + t * texture2D(u_Sampler0, v_UV);

    if (!u_LightingOn) {
      gl_FragColor = baseColor;
      return;
    }

    // phong lighting
    vec3 ambient = 0.15 * baseColor.rgb;
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    vec3 viewDir = normalize(u_CameraPos - v_WorldPos);

    // point light contribution
    if (u_PointLightOn) {
      vec3 lightDir = normalize(u_LightPos - v_WorldPos);
      float diff = max(dot(normal, lightDir), 0.0);
      diffuse += diff * u_LightColor * baseColor.rgb;

      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      specular += spec * u_LightColor * 0.8;
    }

    // spotlight contribution
    if (u_SpotLightOn) {
      vec3 spotDir = normalize(u_SpotLightPos - v_WorldPos);
      float theta = dot(spotDir, normalize(-u_SpotLightDir));

      if (theta > u_SpotLightCutoff) {
        float intensity = (theta - u_SpotLightCutoff) / (1.0 - u_SpotLightCutoff);
        intensity = clamp(intensity, 0.0, 1.0);

        float diff = max(dot(normal, spotDir), 0.0);
        diffuse += diff * u_SpotLightColor * baseColor.rgb * intensity;

        vec3 reflectDir = reflect(-spotDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        specular += spec * u_SpotLightColor * 0.8 * intensity;
      }
    }

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, baseColor.a);
  }`;

// gl variables
let canvas, gl;
let a_Position, a_Color, a_texColorWeight, a_UV, a_Normal;
let u_Sampler0, u_ViewMatrix, u_ProjectionMatrix, u_ModelMatrix;
let u_LightingOn, u_NormalVizOn;
let u_LightPos, u_LightColor, u_PointLightOn;
let u_SpotLightPos, u_SpotLightDir, u_SpotLightCutoff, u_SpotLightColor, u_SpotLightOn;
let u_CameraPos;

// game objects
let camera;
let worldChunks = [];

let totalLuckyBlocks = 0;
let collectedLuckyBlocks = 0;

// controls
const keyState = {};
let currentBlockType = BLOCK_TYPES.GRASS;

// timing
let previousFrameTime = Date.now();
let g_startTime = Date.now() / 1000.0;
let g_seconds = 0;

// lighting state
let g_lightingOn = true;
let g_normalVizOn = false;
let g_pointLightOn = true;
let g_spotLightOn = false;
let g_lightAngle = 0;
let g_lightY = 5;
let g_lightColorR = 1.0;
let g_lightColorG = 1.0;
let g_lightColorB = 1.0;
let g_lightAnimOn = true;

// sphere buffer
let g_sphereBuffer = null;
let g_sphereVertCount = 0;

// standalone cube buffer (for light indicator, etc)
let g_simpleCubeBuffer = null;

// obj model
let g_objBuffer = null;
let g_objVertCount = 0;
let g_objLoaded = false;

function main() {
  initWebGL();
  setupShaders();
  setupControls();

  camera = new Camera(canvas);

  buildSimpleCubeBuffer();
  buildSphereBuffer(20, 20);

  loadTexture();
}

function initWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.53, 0.81, 0.92, 1.0);
}

function setupShaders() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Shader initialization failed');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  a_texColorWeight = gl.getAttribLocation(gl.program, 'a_texColorWeight');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  u_LightingOn = gl.getUniformLocation(gl.program, 'u_LightingOn');
  u_NormalVizOn = gl.getUniformLocation(gl.program, 'u_NormalVizOn');

  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_PointLightOn = gl.getUniformLocation(gl.program, 'u_PointLightOn');

  u_SpotLightPos = gl.getUniformLocation(gl.program, 'u_SpotLightPos');
  u_SpotLightDir = gl.getUniformLocation(gl.program, 'u_SpotLightDir');
  u_SpotLightCutoff = gl.getUniformLocation(gl.program, 'u_SpotLightCutoff');
  u_SpotLightColor = gl.getUniformLocation(gl.program, 'u_SpotLightColor');
  u_SpotLightOn = gl.getUniformLocation(gl.program, 'u_SpotLightOn');

  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
}

function loadTexture() {
  let img = new Image();

  img.onload = function() {
    let tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(u_Sampler0, 0);

    console.log('Texture loaded!');
    createWorld();
    loadOBJModel();
    startGameLoop();
  };

  img.src = './texture_atlas.png';
}

// ---- sphere generation ----

function buildSphereBuffer(latBands, lonBands) {
  let verts = [];

  for (let lat = 0; lat < latBands; lat++) {
    let theta1 = (lat / latBands) * Math.PI;
    let theta2 = ((lat + 1) / latBands) * Math.PI;

    for (let lon = 0; lon < lonBands; lon++) {
      let phi1 = (lon / lonBands) * 2 * Math.PI;
      let phi2 = ((lon + 1) / lonBands) * 2 * Math.PI;

      let x1 = Math.sin(theta1) * Math.cos(phi1);
      let y1 = Math.cos(theta1);
      let z1 = Math.sin(theta1) * Math.sin(phi1);

      let x2 = Math.sin(theta1) * Math.cos(phi2);
      let y2 = Math.cos(theta1);
      let z2 = Math.sin(theta1) * Math.sin(phi2);

      let x3 = Math.sin(theta2) * Math.cos(phi2);
      let y3 = Math.cos(theta2);
      let z3 = Math.sin(theta2) * Math.sin(phi2);

      let x4 = Math.sin(theta2) * Math.cos(phi1);
      let y4 = Math.cos(theta2);
      let z4 = Math.sin(theta2) * Math.sin(phi1);

      // for a unit sphere centered at origin, normal = position
      // stride: pos(3) + normal(3) = 6 floats per vert

      // triangle 1
      verts.push(x1, y1, z1, x1, y1, z1);
      verts.push(x2, y2, z2, x2, y2, z2);
      verts.push(x3, y3, z3, x3, y3, z3);

      // triangle 2
      verts.push(x1, y1, z1, x1, y1, z1);
      verts.push(x3, y3, z3, x3, y3, z3);
      verts.push(x4, y4, z4, x4, y4, z4);
    }
  }

  g_sphereVertCount = verts.length / 6;
  let arr = new Float32Array(verts);

  g_sphereBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
}

function drawSphere(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);

  const F = Float32Array.BYTES_PER_ELEMENT;
  const STRIDE = 6 * F;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, STRIDE, 3 * F);
  gl.enableVertexAttribArray(a_Normal);

  // set color via vertex attrib (constant for all verts)
  gl.disableVertexAttribArray(a_Color);
  gl.vertexAttrib4f(a_Color, color[0], color[1], color[2], color[3]);

  gl.disableVertexAttribArray(a_UV);
  gl.vertexAttrib2f(a_UV, 0, 0);

  gl.disableVertexAttribArray(a_texColorWeight);
  gl.vertexAttrib1f(a_texColorWeight, 0.0);

  gl.drawArrays(gl.TRIANGLES, 0, g_sphereVertCount);
}

// ---- simple cube (for light indicator, standalone objects) ----

function buildSimpleCubeBuffer() {
  // pos(3) + normal(3) = 6 floats per vert
  let v = [
    // front (+z)
    -0.5,-0.5, 0.5, 0,0,1,   0.5,-0.5, 0.5, 0,0,1,   0.5, 0.5, 0.5, 0,0,1,
    -0.5,-0.5, 0.5, 0,0,1,   0.5, 0.5, 0.5, 0,0,1,  -0.5, 0.5, 0.5, 0,0,1,
    // back (-z)
     0.5,-0.5,-0.5, 0,0,-1, -0.5,-0.5,-0.5, 0,0,-1, -0.5, 0.5,-0.5, 0,0,-1,
     0.5,-0.5,-0.5, 0,0,-1, -0.5, 0.5,-0.5, 0,0,-1,  0.5, 0.5,-0.5, 0,0,-1,
    // top (+y)
    -0.5, 0.5, 0.5, 0,1,0,   0.5, 0.5, 0.5, 0,1,0,   0.5, 0.5,-0.5, 0,1,0,
    -0.5, 0.5, 0.5, 0,1,0,   0.5, 0.5,-0.5, 0,1,0,  -0.5, 0.5,-0.5, 0,1,0,
    // bottom (-y)
    -0.5,-0.5,-0.5, 0,-1,0,  0.5,-0.5,-0.5, 0,-1,0,  0.5,-0.5, 0.5, 0,-1,0,
    -0.5,-0.5,-0.5, 0,-1,0,  0.5,-0.5, 0.5, 0,-1,0, -0.5,-0.5, 0.5, 0,-1,0,
    // right (+x)
     0.5,-0.5, 0.5, 1,0,0,   0.5,-0.5,-0.5, 1,0,0,   0.5, 0.5,-0.5, 1,0,0,
     0.5,-0.5, 0.5, 1,0,0,   0.5, 0.5,-0.5, 1,0,0,   0.5, 0.5, 0.5, 1,0,0,
    // left (-x)
    -0.5,-0.5,-0.5,-1,0,0,  -0.5,-0.5, 0.5,-1,0,0,  -0.5, 0.5, 0.5,-1,0,0,
    -0.5,-0.5,-0.5,-1,0,0,  -0.5, 0.5, 0.5,-1,0,0,  -0.5, 0.5,-0.5,-1,0,0
  ];

  let arr = new Float32Array(v);
  g_simpleCubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_simpleCubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
}

function drawSimpleCube(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_simpleCubeBuffer);

  const F = Float32Array.BYTES_PER_ELEMENT;
  const STRIDE = 6 * F;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, STRIDE, 3 * F);
  gl.enableVertexAttribArray(a_Normal);

  gl.disableVertexAttribArray(a_Color);
  gl.vertexAttrib4f(a_Color, color[0], color[1], color[2], color[3]);

  gl.disableVertexAttribArray(a_UV);
  gl.vertexAttrib2f(a_UV, 0, 0);

  gl.disableVertexAttribArray(a_texColorWeight);
  gl.vertexAttrib1f(a_texColorWeight, 0.0);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// ---- OBJ loader ----

function loadOBJModel() {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', './model.obj', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      parseOBJ(xhr.responseText);
      g_objLoaded = true;
      console.log('OBJ model loaded!');
    } else {
      console.log('No OBJ model found, skipping');
    }
  };
  xhr.onerror = function() {
    console.log('No OBJ model found, skipping');
  };
  xhr.send();
}

function parseOBJ(text) {
  let positions = [];
  let normals = [];
  let vertexData = [];

  let lines = text.split('\n');
  for (let line of lines) {
    let parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') {
      positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (parts[0] === 'vn') {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (parts[0] === 'f') {
      let faceVerts = [];
      for (let i = 1; i < parts.length; i++) {
        let indices = parts[i].split('/');
        let pi = (parseInt(indices[0]) - 1) * 3;
        let ni = indices[2] ? (parseInt(indices[2]) - 1) * 3 : -1;

        let px = positions[pi], py = positions[pi + 1], pz = positions[pi + 2];
        let nx = 0, ny = 1, nz = 0;
        if (ni >= 0 && ni < normals.length) {
          nx = normals[ni]; ny = normals[ni + 1]; nz = normals[ni + 2];
        }
        faceVerts.push(px, py, pz, nx, ny, nz);
      }

      // triangulate face (fan triangulation)
      for (let i = 1; i < faceVerts.length / 6 - 1; i++) {
        vertexData.push(
          faceVerts[0], faceVerts[1], faceVerts[2], faceVerts[3], faceVerts[4], faceVerts[5],
          faceVerts[i * 6], faceVerts[i * 6 + 1], faceVerts[i * 6 + 2], faceVerts[i * 6 + 3], faceVerts[i * 6 + 4], faceVerts[i * 6 + 5],
          faceVerts[(i + 1) * 6], faceVerts[(i + 1) * 6 + 1], faceVerts[(i + 1) * 6 + 2], faceVerts[(i + 1) * 6 + 3], faceVerts[(i + 1) * 6 + 4], faceVerts[(i + 1) * 6 + 5]
        );
      }
    }
  }

  g_objVertCount = vertexData.length / 6;
  let arr = new Float32Array(vertexData);
  g_objBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_objBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
}

function drawOBJ(modelMatrix, color) {
  if (!g_objLoaded || !g_objBuffer) return;

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_objBuffer);

  const F = Float32Array.BYTES_PER_ELEMENT;
  const STRIDE = 6 * F;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, STRIDE, 3 * F);
  gl.enableVertexAttribArray(a_Normal);

  gl.disableVertexAttribArray(a_Color);
  gl.vertexAttrib4f(a_Color, color[0], color[1], color[2], color[3]);

  gl.disableVertexAttribArray(a_UV);
  gl.vertexAttrib2f(a_UV, 0, 0);

  gl.disableVertexAttribArray(a_texColorWeight);
  gl.vertexAttrib1f(a_texColorWeight, 0.0);

  gl.drawArrays(gl.TRIANGLES, 0, g_objVertCount);
}

// ---- controls ----

function setupControls() {
  canvas.onclick = () => canvas.requestPointerLock();

  function handleMouseMovement(event) {
    if (document.pointerLockElement !== canvas) return;
    let sensitivity = 0.1;
    camera.panYawDegrees(event.movementX * sensitivity);
    camera.panPitchDegrees(-event.movementY * sensitivity);
  }

  function onKeyDown(e) {
    keyState[e.code] = true;
    if (e.key >= '1' && e.key <= '6') {
      currentBlockType = parseInt(e.key);
      refreshUI();
    }
  }

  function onKeyUp(e) {
    keyState[e.code] = false;
  }

  function handleClick(e) {
    let targetBlock = findBlockPlayerIsLookingAt();
    if (e.button === 0) {
      placeBlockInWorld(currentBlockType, targetBlock.x, targetBlock.y, targetBlock.z);
    } else if (e.button === 2) {
      collectBlock(targetBlock.x, targetBlock.y, targetBlock.z);
    }
  }

  canvas.oncontextmenu = (e) => { e.preventDefault(); return false; };

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', handleMouseMovement);
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      canvas.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousemove', handleMouseMovement);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', handleClick);
    }
  });

  // ui buttons
  document.getElementById('btnLightingOn').onclick = () => { g_lightingOn = true; };
  document.getElementById('btnLightingOff').onclick = () => { g_lightingOn = false; };
  document.getElementById('btnNormalOn').onclick = () => { g_normalVizOn = true; };
  document.getElementById('btnNormalOff').onclick = () => { g_normalVizOn = false; };
  document.getElementById('btnPointOn').onclick = () => { g_pointLightOn = true; };
  document.getElementById('btnPointOff').onclick = () => { g_pointLightOn = false; };
  document.getElementById('btnSpotOn').onclick = () => { g_spotLightOn = true; };
  document.getElementById('btnSpotOff').onclick = () => { g_spotLightOn = false; };
  document.getElementById('btnAnimOn').onclick = () => { g_lightAnimOn = true; };
  document.getElementById('btnAnimOff').onclick = () => { g_lightAnimOn = false; };

  document.getElementById('lightX').addEventListener('input', function() {
    g_lightAngle = parseFloat(this.value);
    document.getElementById('lightXVal').innerHTML = this.value;
  });
  document.getElementById('lightY').addEventListener('input', function() {
    g_lightY = parseFloat(this.value);
    document.getElementById('lightYVal').innerHTML = this.value;
  });
  document.getElementById('lightR').addEventListener('input', function() {
    g_lightColorR = parseFloat(this.value) / 255;
    document.getElementById('lightRVal').innerHTML = this.value;
  });
  document.getElementById('lightG').addEventListener('input', function() {
    g_lightColorG = parseFloat(this.value) / 255;
    document.getElementById('lightGVal').innerHTML = this.value;
  });
  document.getElementById('lightB').addEventListener('input', function() {
    g_lightColorB = parseFloat(this.value) / 255;
    document.getElementById('lightBVal').innerHTML = this.value;
  });
}

// ---- world generation ----

function createWorld() {
  let worldSize = CHUNK_SIZE * 2;
  let halfSize = worldSize / 2;

  for (let cx = -halfSize; cx < halfSize; cx += CHUNK_SIZE) {
    for (let cy = 0; cy < worldSize / 2; cy += CHUNK_SIZE) {
      for (let cz = -halfSize; cz < halfSize; cz += CHUNK_SIZE) {
        let chunk = new Chunk(gl, [cx, cy, cz]);
        worldChunks.push(chunk);
      }
    }
  }

  generateGroundLayer();
  generateWallStructures();
  generateLuckyBlockPlacements();

  for (let chunk of worldChunks) {
    chunk.rebuildGeometry();
  }
}

function generateGroundLayer() {
  let size = CHUNK_SIZE * 2;
  let half = size / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      addWorldBlock(BLOCK_TYPES.GRASS, x, 0, z);
    }
  }
}

function generateWallStructures() {
  let size = CHUNK_SIZE * 2;
  let half = size / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      if (x === -half || x === half - 1 || z === -half || z === half - 1) {
        for (let h = 1; h <= 3; h++) {
          addWorldBlock(BLOCK_TYPES.STONE, x, h, z);
        }
      }
    }
  }
  for (let x = -6; x <= 6; x += 12) {
    for (let z = -8; z <= 8; z++) {
      if (Math.abs(z) > 1) {
        addWorldBlock(BLOCK_TYPES.OAK_PLANK, x, 1, z);
        addWorldBlock(BLOCK_TYPES.OAK_PLANK, x, 2, z);
      }
    }
  }
}

function generateLuckyBlockPlacements() {
  let size = CHUNK_SIZE * 2;
  let half = size / 2;
  for (let x = -half + 3; x < half - 3; x += 4) {
    for (let z = -half + 3; z < half - 3; z += 4) {
      if (Math.random() < 0.25) {
        addWorldBlock(BLOCK_TYPES.LUCKY, x, 1, z);
        totalLuckyBlocks++;
      }
    }
  }
  console.log(`Created ${totalLuckyBlocks} lucky blocks to collect!`);
}

function addWorldBlock(type, worldX, worldY, worldZ) {
  for (let chunk of worldChunks) {
    if (worldX >= chunk.originX && worldX < chunk.originX + CHUNK_SIZE &&
        worldY >= chunk.originY && worldY < chunk.originY + CHUNK_SIZE &&
        worldZ >= chunk.originZ && worldZ < chunk.originZ + CHUNK_SIZE) {
      let localX = worldX % CHUNK_SIZE;
      let localY = worldY % CHUNK_SIZE;
      let localZ = worldZ % CHUNK_SIZE;
      if (localX < 0) localX += CHUNK_SIZE;
      if (localY < 0) localY += CHUNK_SIZE;
      if (localZ < 0) localZ += CHUNK_SIZE;
      let idx = getIndex(localX, localY, localZ);
      chunk.blocks[idx] = type;
      return;
    }
  }
}

function placeBlockInWorld(type, worldX, worldY, worldZ) {
  for (let chunk of worldChunks) {
    if (worldX >= chunk.originX && worldX < chunk.originX + CHUNK_SIZE &&
        worldY >= chunk.originY && worldY < chunk.originY + CHUNK_SIZE &&
        worldZ >= chunk.originZ && worldZ < chunk.originZ + CHUNK_SIZE) {
      let localX = worldX % CHUNK_SIZE;
      let localY = worldY % CHUNK_SIZE;
      let localZ = worldZ % CHUNK_SIZE;
      if (localX < 0) localX += CHUNK_SIZE;
      if (localY < 0) localY += CHUNK_SIZE;
      if (localZ < 0) localZ += CHUNK_SIZE;
      let idx = getIndex(localX, localY, localZ);
      if (chunk.blocks[idx] === BLOCK_TYPES.AIR) {
        chunk.blocks[idx] = type;
        chunk.rebuildGeometry();
      }
      return;
    }
  }
}

function collectBlock(worldX, worldY, worldZ) {
  for (let chunk of worldChunks) {
    if (worldX >= chunk.originX && worldX < chunk.originX + CHUNK_SIZE &&
        worldY >= chunk.originY && worldY < chunk.originY + CHUNK_SIZE &&
        worldZ >= chunk.originZ && worldZ < chunk.originZ + CHUNK_SIZE) {
      let localX = worldX % CHUNK_SIZE;
      let localY = worldY % CHUNK_SIZE;
      let localZ = worldZ % CHUNK_SIZE;
      if (localX < 0) localX += CHUNK_SIZE;
      if (localY < 0) localY += CHUNK_SIZE;
      if (localZ < 0) localZ += CHUNK_SIZE;
      let idx = getIndex(localX, localY, localZ);
      let blockType = chunk.blocks[idx];
      if (blockType === BLOCK_TYPES.LUCKY) {
        collectedLuckyBlocks++;
        refreshUI();
      }
      chunk.blocks[idx] = BLOCK_TYPES.AIR;
      chunk.rebuildGeometry();
      return true;
    }
  }
  return false;
}

function findBlockPlayerIsLookingAt() {
  let lookDirection = new Vector3();
  lookDirection.set(camera.at).sub(camera.eye).normalize();
  let targetPosition = new Vector3();
  targetPosition.set(camera.eye).add(new Vector3().set(lookDirection).mul(CUBE_SIZE * 2.0));
  let blockX = Math.round(targetPosition.elements[0] / CUBE_SIZE);
  let blockY = Math.round(targetPosition.elements[1] / CUBE_SIZE);
  let blockZ = Math.round(targetPosition.elements[2] / CUBE_SIZE);
  return { x: blockX, y: blockY, z: blockZ };
}

// ---- game loop ----

function startGameLoop() {
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  let currentTime = Date.now();
  let dt = (currentTime - previousFrameTime) / 1000.0;
  previousFrameTime = currentTime;
  g_seconds = currentTime / 1000.0 - g_startTime;

  processInput(dt);

  if (g_lightAnimOn) {
    g_lightAngle = g_seconds * 60;
    let slider = document.getElementById('lightX');
    slider.value = g_lightAngle % 360;
    document.getElementById('lightXVal').innerHTML = Math.round(g_lightAngle % 360);
  }

  drawScene();
  refreshUI();
  requestAnimationFrame(gameLoop);
}

function processInput(deltaTime) {
  if (keyState['KeyW']) camera.moveForward(deltaTime);
  if (keyState['KeyS']) camera.moveBackwards(deltaTime);
  if (keyState['KeyA']) camera.moveLeft(deltaTime);
  if (keyState['KeyD']) camera.moveRight(deltaTime);
  if (keyState['KeyQ']) camera.panLeft(deltaTime);
  if (keyState['KeyE']) camera.panRight(deltaTime);
}

// ---- rendering ----

function drawScene() {
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // camera pos for specular
  gl.uniform3f(u_CameraPos,
    camera.eye.elements[0],
    camera.eye.elements[1],
    camera.eye.elements[2]);

  // lighting uniforms
  gl.uniform1i(u_LightingOn, g_lightingOn ? 1 : 0);
  gl.uniform1i(u_NormalVizOn, g_normalVizOn ? 1 : 0);
  gl.uniform1i(u_PointLightOn, g_pointLightOn ? 1 : 0);

  // point light position (orbiting)
  let lightRadius = 8;
  let lightRad = g_lightAngle * Math.PI / 180;
  let lightX = Math.cos(lightRad) * lightRadius;
  let lightZ = Math.sin(lightRad) * lightRadius;
  gl.uniform3f(u_LightPos, lightX, g_lightY, lightZ);
  gl.uniform3f(u_LightColor, g_lightColorR, g_lightColorG, g_lightColorB);

  // spotlight (points downward from above center)
  gl.uniform1i(u_SpotLightOn, g_spotLightOn ? 1 : 0);
  gl.uniform3f(u_SpotLightPos, 0, 10, 0);
  gl.uniform3f(u_SpotLightDir, 0, -1, 0);
  gl.uniform1f(u_SpotLightCutoff, Math.cos(25 * Math.PI / 180));
  gl.uniform3f(u_SpotLightColor, 1.0, 1.0, 0.8);

  // identity model matrix for world chunks (positions are baked in)
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

  // render world chunks
  for (let chunk of worldChunks) {
    chunk.drawChunk(a_Position, a_UV, a_Color, a_texColorWeight, a_Normal);
  }

  // draw light indicator cube (no lighting on it)
  gl.uniform1i(u_LightingOn, 0);
  gl.uniform1i(u_NormalVizOn, 0);
  let lightMat = new Matrix4();
  lightMat.translate(lightX, g_lightY, lightZ);
  lightMat.scale(0.3, 0.3, 0.3);
  drawSimpleCube(lightMat, [1.0, 1.0, 0.0, 1.0]);

  // restore lighting state
  gl.uniform1i(u_LightingOn, g_lightingOn ? 1 : 0);
  gl.uniform1i(u_NormalVizOn, g_normalVizOn ? 1 : 0);

  // draw sphere
  let sphereMat = new Matrix4();
  sphereMat.translate(3, 1.5, 0);
  sphereMat.scale(1.5, 1.5, 1.5);
  drawSphere(sphereMat, [0.8, 0.2, 0.2, 1.0]);

  // draw second sphere
  let sphere2Mat = new Matrix4();
  sphere2Mat.translate(-3, 1.5, -3);
  sphere2Mat.scale(1.0, 1.0, 1.0);
  drawSphere(sphere2Mat, [0.2, 0.5, 0.9, 1.0]);

  // draw OBJ model if loaded
  if (g_objLoaded) {
    let objMat = new Matrix4();
    objMat.translate(0, 1.5, -5);
    objMat.scale(0.5, 0.5, 0.5);
    drawOBJ(objMat, [0.7, 0.7, 0.7, 1.0]);
  }
}

function refreshUI() {
  let pos = camera.eye.elements;
  document.getElementById('position').innerHTML =
    `(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)})`;

  document.getElementById('luckyBlocks').innerHTML =
    `${collectedLuckyBlocks}/${totalLuckyBlocks}`;

  let blockNames = ['AIR', 'Lucky', 'Grass', 'Dirt', 'Stone', 'Wood', 'Pumpkin'];
  document.getElementById('selectedBlock').innerHTML = blockNames[currentBlockType] || 'Unknown';

  if (collectedLuckyBlocks >= totalLuckyBlocks && totalLuckyBlocks > 0) {
    document.getElementById('gameStatus').innerHTML =
      'VICTORY! You collected all ' + totalLuckyBlocks + ' Lucky Blocks!';
  } else if (collectedLuckyBlocks > 0) {
    document.getElementById('gameStatus').innerHTML =
      `Found ${collectedLuckyBlocks} of ${totalLuckyBlocks} Lucky Blocks!`;
  } else {
    document.getElementById('gameStatus').innerHTML = 'Find all the Lucky Blocks!';
  }
}
