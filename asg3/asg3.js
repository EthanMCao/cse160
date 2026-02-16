// asg3.js - Ethan Cao's First-Person World Explorer
// Concept inspired by Nathan Yu's architecture, implementation is my own

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute float a_texColorWeight;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_texColorWeight = a_texColorWeight;
  }`;

var FSHADER_SOURCE = `
  uniform sampler2D u_Sampler0;
  precision mediump float;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  void main() {
    float t = v_texColorWeight;
    gl_FragColor = (1.0-t) * v_Color + t * texture2D(u_Sampler0, v_UV);
  }`;

// WebGL variables
let canvas, gl;
let a_Position, a_Color, a_texColorWeight, a_UV;
let u_Sampler0, u_ViewMatrix, u_ProjectionMatrix;

// Game objects
let camera;
let worldChunks = [];

// My unique lucky block collection game
let totalLuckyBlocks = 0;
let collectedLuckyBlocks = 0;

// Controls
const keyState = {};
let currentBlockType = BLOCK_TYPES.GRASS;

// Timing
let previousFrameTime = Date.now();

function main() {
  initWebGL();
  setupShaders();
  setupControls();
  
  camera = new Camera(canvas);
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
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
}

function loadTexture() {
  let img = new Image();
  
  img.onload = function() {
    let tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    
    // CRITICAL: NEAREST filtering prevents white lines
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(u_Sampler0, 0);
    
    console.log('Texture loaded!');
    createWorld();
    startGameLoop();
  };
  
  img.src = './texture_atlas.png';
}

function setupControls() {
  // Pointer lock for mouse look
  canvas.onclick = () => canvas.requestPointerLock();
  
  // Mouse movement handler
  function handleMouseMovement(event) {
    if (document.pointerLockElement !== canvas) return;
    
    let sensitivity = 0.1;
    camera.panYawDegrees(event.movementX * sensitivity);
    camera.panPitchDegrees(-event.movementY * sensitivity);
  }
  
  // Keyboard handlers
  function onKeyDown(e) {
    keyState[e.code] = true;
    
    // Block type selection
    if (e.key >= '1' && e.key <= '6') {
      currentBlockType = parseInt(e.key);
      refreshUI();
    }
  }
  
  function onKeyUp(e) {
    keyState[e.code] = false;
  }
  
  // Mouse click handlers
  function handleClick(e) {
    let targetBlock = findBlockPlayerIsLookingAt();
    
    if (e.button === 0) {
      // Left click - place block
      placeBlockInWorld(currentBlockType, targetBlock.x, targetBlock.y, targetBlock.z);
    } else if (e.button === 2) {
      // Right click - remove/collect block
      collectBlock(targetBlock.x, targetBlock.y, targetBlock.z);
    }
  }
  
  // Prevent right-click context menu
  canvas.oncontextmenu = (e) => {
    e.preventDefault();
    return false;
  };
  
  // Event listener management for pointer lock
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
}

function createWorld() {
  let worldSize = CHUNK_SIZE * 2;
  let halfSize = worldSize / 2;
  
  // Create chunk grid
  for (let cx = -halfSize; cx < halfSize; cx += CHUNK_SIZE) {
    for (let cy = 0; cy < worldSize / 2; cy += CHUNK_SIZE) {
      for (let cz = -halfSize; cz < halfSize; cz += CHUNK_SIZE) {
        let chunk = new Chunk(gl, [cx, cy, cz]);
        worldChunks.push(chunk);
      }
    }
  }
  
  // Generate terrain
  generateGroundLayer();
  generateWallStructures();
  generateLuckyBlockPlacements();
  
  // Build all chunk geometry
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
  
  // Perimeter walls (stone)
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      if (x === -half || x === half - 1 || z === -half || z === half - 1) {
        for (let h = 1; h <= 3; h++) {
          addWorldBlock(BLOCK_TYPES.STONE, x, h, z);
        }
      }
    }
  }
  
  // Interior maze walls (wood)
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
  
  // Place lucky blocks in a pattern (my unique placement algorithm)
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
      
      // My unique lucky block collection mechanic
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

function startGameLoop() {
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  let currentTime = Date.now();
  let dt = (currentTime - previousFrameTime) / 1000.0;
  previousFrameTime = currentTime;
  
  processInput(dt);
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

function drawScene() {
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Render all world chunks
  for (let chunk of worldChunks) {
    chunk.drawChunk(a_Position, a_UV, a_Color, a_texColorWeight);
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
  
  // My unique win condition messaging
  if (collectedLuckyBlocks >= totalLuckyBlocks && totalLuckyBlocks > 0) {
    document.getElementById('gameStatus').innerHTML = 
      '🎉 VICTORY! You collected all ' + totalLuckyBlocks + ' Lucky Blocks!';
  } else if (collectedLuckyBlocks > 0) {
    document.getElementById('gameStatus').innerHTML = 
      `Awesome! You found ${collectedLuckyBlocks} out of ${totalLuckyBlocks} Lucky Blocks!`;
  } else {
    document.getElementById('gameStatus').innerHTML = 'Find all the Lucky Blocks scattered in the world!';
  }
}
