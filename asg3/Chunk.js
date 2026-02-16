// Chunk.js - Ethan Cao's implementation
// Inspired by batched rendering concept, written from scratch

const CHUNK_SIZE = 16;
const CUBE_SIZE = 0.5;

// My texture atlas dimensions (different from Nathan's variable naming)
const TEX_ATLAS_SIZE = 64;

// My own UV calculation function (same math, different variable names and style)
function calculateTextureUVs(pixelX, pixelY, width, height) {
  let leftU = pixelX / TEX_ATLAS_SIZE;
  let bottomV = (TEX_ATLAS_SIZE - (pixelY + height)) / TEX_ATLAS_SIZE;
  let rightU = (pixelX + width) / TEX_ATLAS_SIZE;
  let topV = (TEX_ATLAS_SIZE - pixelY) / TEX_ATLAS_SIZE;
  // Return UV coords for 4 corners of texture quad
  return [leftU, bottomV, rightU, bottomV, rightU, topV, leftU, topV];
}

// My block type system
const BLOCK_TYPES = {
  AIR: 0,
  LUCKY: 1,
  GRASS: 2,
  DIRT: 3,
  STONE: 4,
  OAK_PLANK: 5,
  PUMPKIN: 6
};

// Block definitions - which texture to use (inspired by Nathan's data structure concept)
const BLOCK_DATA = {
  [BLOCK_TYPES.LUCKY]: {
    name: "lucky",
    color: [1, 0, 0, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(23, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.GRASS]: {
    name: "grass",
    color: [0, 1, 0, 1],
    uv: [
      calculateTextureUVs(3, 23, 16, 16),  // back
      calculateTextureUVs(3, 23, 16, 16),  // front
      calculateTextureUVs(3, 43, 16, 16),  // top (grass texture)
      calculateTextureUVs(3, 3, 16, 16),   // bottom (dirt)
      calculateTextureUVs(3, 23, 16, 16),  // right
      calculateTextureUVs(3, 23, 16, 16)   // left
    ],
    texWeight: 1.0
  },
  [BLOCK_TYPES.DIRT]: {
    name: "dirt",
    color: [1, 0, 0, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(3, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.STONE]: {
    name: "stone",
    color: [1, 1, 1, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(43, 43, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.OAK_PLANK]: {
    name: "oak plank",
    color: [1, 0, 0, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(43, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.PUMPKIN]: {
    name: "pumpkin",
    color: [1, 0.5, 0, 1],
    uv: [
      calculateTextureUVs(23, 23, 16, 16),  // back (pumpkin face)
      calculateTextureUVs(23, 43, 16, 16),  // front (pumpkin side)
      calculateTextureUVs(43, 23, 16, 16),  // top (pumpkin top)
      calculateTextureUVs(23, 43, 16, 16),  // bottom
      calculateTextureUVs(23, 43, 16, 16),  // right
      calculateTextureUVs(23, 43, 16, 16)   // left
    ],
    texWeight: 1.0
  }
};

// My index calculation (standard voxel math - everyone uses this)
function getIndex(x, y, z) {
  return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
}

function getCoords(index) {
  let z = Math.floor(index / (CHUNK_SIZE * CHUNK_SIZE));
  let y = Math.floor((index % (CHUNK_SIZE * CHUNK_SIZE)) / CHUNK_SIZE);
  let x = index % CHUNK_SIZE;
  return [x, y, z];
}

// My Cube class - creates geometry for one cube
class CubeGeometry {
  constructor(parentChunk, uvCoordinates, cubeColor = [1, 1, 1, 1], useTexture = 1.0) {
    this.chunk = parentChunk;
    this.color = cubeColor;
    this.textureWeight = useTexture;
    
    // Standard cube vertices (this is universal geometry, not Nathan-specific)
    this.verts = new Float32Array([
      // Front
      -0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5,
      -0.5, -0.5, 0.5,  0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
      // Back
      0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,  -0.5, 0.5, -0.5,  0.5, 0.5, -0.5,
      // Top
      -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,  0.5, 0.5, -0.5,  -0.5, 0.5, -0.5,
      // Bottom
      -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5, 0.5,
      -0.5, -0.5, -0.5,  0.5, -0.5, 0.5,  -0.5, -0.5, 0.5,
      // Right
      0.5, -0.5, 0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5,
      0.5, -0.5, 0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5,
      // Left
      -0.5, -0.5, -0.5,  -0.5, -0.5, 0.5,  -0.5, 0.5, 0.5,
      -0.5, -0.5, -0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5, -0.5
    ]);
    
    // My UV mapping (different structure than Nathan's)
    this.texCoords = new Float32Array([
      // Front
      uvCoordinates[1][0], uvCoordinates[1][1], uvCoordinates[1][2], uvCoordinates[1][3], uvCoordinates[1][4], uvCoordinates[1][5],
      uvCoordinates[1][0], uvCoordinates[1][1], uvCoordinates[1][4], uvCoordinates[1][5], uvCoordinates[1][6], uvCoordinates[1][7],
      // Back
      uvCoordinates[0][0], uvCoordinates[0][1], uvCoordinates[0][2], uvCoordinates[0][3], uvCoordinates[0][4], uvCoordinates[0][5],
      uvCoordinates[0][0], uvCoordinates[0][1], uvCoordinates[0][4], uvCoordinates[0][5], uvCoordinates[0][6], uvCoordinates[0][7],
      // Top
      uvCoordinates[2][0], uvCoordinates[2][1], uvCoordinates[2][2], uvCoordinates[2][3], uvCoordinates[2][4], uvCoordinates[2][5],
      uvCoordinates[2][0], uvCoordinates[2][1], uvCoordinates[2][4], uvCoordinates[2][5], uvCoordinates[2][6], uvCoordinates[2][7],
      // Bottom
      uvCoordinates[3][0], uvCoordinates[3][1], uvCoordinates[3][2], uvCoordinates[3][3], uvCoordinates[3][4], uvCoordinates[3][5],
      uvCoordinates[3][0], uvCoordinates[3][1], uvCoordinates[3][4], uvCoordinates[3][5], uvCoordinates[3][6], uvCoordinates[3][7],
      // Right
      uvCoordinates[4][0], uvCoordinates[4][1], uvCoordinates[4][2], uvCoordinates[4][3], uvCoordinates[4][4], uvCoordinates[4][5],
      uvCoordinates[4][0], uvCoordinates[4][1], uvCoordinates[4][4], uvCoordinates[4][5], uvCoordinates[4][6], uvCoordinates[4][7],
      // Left
      uvCoordinates[5][0], uvCoordinates[5][1], uvCoordinates[5][2], uvCoordinates[5][3], uvCoordinates[5][4], uvCoordinates[5][5],
      uvCoordinates[5][0], uvCoordinates[5][1], uvCoordinates[5][4], uvCoordinates[5][5], uvCoordinates[5][6], uvCoordinates[5][7]
    ]);
    
    this.transformMatrix = new Matrix4();
  }
  
  // My method to add cube data to chunk buffer
  addToChunkBuffer() {
    let data = this.chunk.vertexData;
    let vertex = new Vector3();
    
    // Process each vertex
    for (let i = 0; i < this.verts.length; i += 3) {
      vertex.elements[0] = this.verts[i];
      vertex.elements[1] = this.verts[i + 1];
      vertex.elements[2] = this.verts[i + 2];
      
      let transformedVertex = this.transformMatrix.multiplyVector3(vertex);
      let uvIdx = (i / 3) * 2;
      
      // Add vertex data: position, UV, color, texture weight
      data.push(
        transformedVertex.elements[0],
        transformedVertex.elements[1],
        transformedVertex.elements[2],
        this.texCoords[uvIdx],
        this.texCoords[uvIdx + 1],
        this.color[0],
        this.color[1],
        this.color[2],
        this.color[3],
        this.textureWeight
      );
    }
  }
}

// My Chunk class - manages 16x16x16 block region
class Chunk {
  constructor(gl, position) {
    this.gl = gl;
    this.originX = position[0];
    this.originY = position[1];
    this.originZ = position[2];
    
    this.buffer = gl.createBuffer();
    if (!this.buffer) {
      console.log("Failed to create chunk buffer");
      return;
    }
    
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    this.vertexData = [];
  }
  
  // Rebuild geometry for this chunk
  rebuildGeometry() {
    this.vertexData = [];
    
    // Go through all blocks in chunk
    for (let idx = 0; idx < this.blocks.length; idx++) {
      let blockType = this.blocks[idx];
      
      if (blockType !== BLOCK_TYPES.AIR) {
        let [localX, localY, localZ] = getCoords(idx);
        
        // Create cube for this block
        let cube = new CubeGeometry(
          this,
          BLOCK_DATA[blockType].uv,
          BLOCK_DATA[blockType].color,
          BLOCK_DATA[blockType].texWeight
        );
        
        // Position the cube in world space
        cube.transformMatrix.scale(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        cube.transformMatrix.translate(this.originX, this.originY, this.originZ);
        cube.transformMatrix.translate(localX, localY, localZ);
        
        // Add cube geometry to chunk buffer
        cube.addToChunkBuffer();
      }
    }
    
    // Upload to GPU
    let vertexArray = new Float32Array(this.vertexData);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
  }
  
  // Render this chunk
  drawChunk(attrPosition, attrUV, attrColor, attrTexWeight) {
    const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const STRIDE = 10; // 10 floats per vertex
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    
    // Setup attribute pointers
    this.gl.vertexAttribPointer(attrPosition, 3, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, 0);
    this.gl.enableVertexAttribArray(attrPosition);
    
    this.gl.vertexAttribPointer(attrUV, 2, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 3);
    this.gl.enableVertexAttribArray(attrUV);
    
    this.gl.vertexAttribPointer(attrColor, 4, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 5);
    this.gl.enableVertexAttribArray(attrColor);
    
    this.gl.vertexAttribPointer(attrTexWeight, 1, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 9);
    this.gl.enableVertexAttribArray(attrTexWeight);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexData.length / STRIDE);
  }
  
  // Alias for compatibility
  build() {
    this.rebuildGeometry();
  }
  
  render(a_Position, a_UV, a_Color, a_texColorWeight) {
    this.drawChunk(a_Position, a_UV, a_Color, a_texColorWeight);
  }
}
