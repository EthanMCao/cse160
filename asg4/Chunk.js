// Chunk.js

const CHUNK_SIZE = 16;
const CUBE_SIZE = 0.5;

const TEX_ATLAS_SIZE = 64;

function calculateTextureUVs(pixelX, pixelY, width, height) {
  let leftU = pixelX / TEX_ATLAS_SIZE;
  let bottomV = (TEX_ATLAS_SIZE - (pixelY + height)) / TEX_ATLAS_SIZE;
  let rightU = (pixelX + width) / TEX_ATLAS_SIZE;
  let topV = (TEX_ATLAS_SIZE - pixelY) / TEX_ATLAS_SIZE;
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

const BLOCK_DATA = {
  [BLOCK_TYPES.LUCKY]: {
    name: "lucky",
    color: [1, 0.85, 0, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(23, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.GRASS]: {
    name: "grass",
    color: [0, 1, 0, 1],
    uv: [
      calculateTextureUVs(3, 23, 16, 16),
      calculateTextureUVs(3, 23, 16, 16),
      calculateTextureUVs(3, 43, 16, 16),
      calculateTextureUVs(3, 3, 16, 16),
      calculateTextureUVs(3, 23, 16, 16),
      calculateTextureUVs(3, 23, 16, 16)
    ],
    texWeight: 1.0
  },
  [BLOCK_TYPES.DIRT]: {
    name: "dirt",
    color: [0.6, 0.3, 0.1, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(3, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.STONE]: {
    name: "stone",
    color: [0.6, 0.6, 0.6, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(43, 43, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.OAK_PLANK]: {
    name: "oak plank",
    color: [0.7, 0.5, 0.3, 1],
    uv: Array(6).fill().map(() => calculateTextureUVs(43, 3, 16, 16)),
    texWeight: 1.0
  },
  [BLOCK_TYPES.PUMPKIN]: {
    name: "pumpkin",
    color: [1, 0.5, 0, 1],
    uv: [
      calculateTextureUVs(23, 23, 16, 16),
      calculateTextureUVs(23, 43, 16, 16),
      calculateTextureUVs(43, 23, 16, 16),
      calculateTextureUVs(23, 43, 16, 16),
      calculateTextureUVs(23, 43, 16, 16),
      calculateTextureUVs(23, 43, 16, 16)
    ],
    texWeight: 1.0
  }
};

function getIndex(x, y, z) {
  return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
}

function getCoords(index) {
  let z = Math.floor(index / (CHUNK_SIZE * CHUNK_SIZE));
  let y = Math.floor((index % (CHUNK_SIZE * CHUNK_SIZE)) / CHUNK_SIZE);
  let x = index % CHUNK_SIZE;
  return [x, y, z];
}

// cube face normals: front, back, top, bottom, right, left
const CUBE_NORMALS = [
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0]
];

class CubeGeometry {
  constructor(parentChunk, uvCoordinates, cubeColor = [1, 1, 1, 1], useTexture = 1.0) {
    this.chunk = parentChunk;
    this.color = cubeColor;
    this.textureWeight = useTexture;

    this.verts = new Float32Array([
      // front (+z)
      -0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5,
      -0.5, -0.5, 0.5,  0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
      // back (-z)
      0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,  -0.5, 0.5, -0.5,  0.5, 0.5, -0.5,
      // top (+y)
      -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,  0.5, 0.5, -0.5,  -0.5, 0.5, -0.5,
      // bottom (-y)
      -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5, 0.5,
      -0.5, -0.5, -0.5,  0.5, -0.5, 0.5,  -0.5, -0.5, 0.5,
      // right (+x)
      0.5, -0.5, 0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5,
      0.5, -0.5, 0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5,
      // left (-x)
      -0.5, -0.5, -0.5,  -0.5, -0.5, 0.5,  -0.5, 0.5, 0.5,
      -0.5, -0.5, -0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5, -0.5
    ]);

    this.texCoords = new Float32Array([
      // front
      uvCoordinates[1][0], uvCoordinates[1][1], uvCoordinates[1][2], uvCoordinates[1][3], uvCoordinates[1][4], uvCoordinates[1][5],
      uvCoordinates[1][0], uvCoordinates[1][1], uvCoordinates[1][4], uvCoordinates[1][5], uvCoordinates[1][6], uvCoordinates[1][7],
      // back
      uvCoordinates[0][0], uvCoordinates[0][1], uvCoordinates[0][2], uvCoordinates[0][3], uvCoordinates[0][4], uvCoordinates[0][5],
      uvCoordinates[0][0], uvCoordinates[0][1], uvCoordinates[0][4], uvCoordinates[0][5], uvCoordinates[0][6], uvCoordinates[0][7],
      // top
      uvCoordinates[2][0], uvCoordinates[2][1], uvCoordinates[2][2], uvCoordinates[2][3], uvCoordinates[2][4], uvCoordinates[2][5],
      uvCoordinates[2][0], uvCoordinates[2][1], uvCoordinates[2][4], uvCoordinates[2][5], uvCoordinates[2][6], uvCoordinates[2][7],
      // bottom
      uvCoordinates[3][0], uvCoordinates[3][1], uvCoordinates[3][2], uvCoordinates[3][3], uvCoordinates[3][4], uvCoordinates[3][5],
      uvCoordinates[3][0], uvCoordinates[3][1], uvCoordinates[3][4], uvCoordinates[3][5], uvCoordinates[3][6], uvCoordinates[3][7],
      // right
      uvCoordinates[4][0], uvCoordinates[4][1], uvCoordinates[4][2], uvCoordinates[4][3], uvCoordinates[4][4], uvCoordinates[4][5],
      uvCoordinates[4][0], uvCoordinates[4][1], uvCoordinates[4][4], uvCoordinates[4][5], uvCoordinates[4][6], uvCoordinates[4][7],
      // left
      uvCoordinates[5][0], uvCoordinates[5][1], uvCoordinates[5][2], uvCoordinates[5][3], uvCoordinates[5][4], uvCoordinates[5][5],
      uvCoordinates[5][0], uvCoordinates[5][1], uvCoordinates[5][4], uvCoordinates[5][5], uvCoordinates[5][6], uvCoordinates[5][7]
    ]);

    this.transformMatrix = new Matrix4();
  }

  addToChunkBuffer() {
    let data = this.chunk.vertexData;
    let vertex = new Vector3();

    for (let i = 0; i < this.verts.length; i += 3) {
      vertex.elements[0] = this.verts[i];
      vertex.elements[1] = this.verts[i + 1];
      vertex.elements[2] = this.verts[i + 2];

      let transformedVertex = this.transformMatrix.multiplyVector3(vertex);
      let uvIdx = (i / 3) * 2;

      // figure out which face this vertex belongs to (6 verts per face)
      let faceIdx = Math.floor((i / 3) / 6);
      let normal = CUBE_NORMALS[faceIdx];

      // stride: pos(3) + uv(2) + color(4) + texWeight(1) + normal(3) = 13
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
        this.textureWeight,
        normal[0],
        normal[1],
        normal[2]
      );
    }
  }
}

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
    this.vertexCount = 0;
  }

  rebuildGeometry() {
    this.vertexData = [];

    for (let idx = 0; idx < this.blocks.length; idx++) {
      let blockType = this.blocks[idx];

      if (blockType !== BLOCK_TYPES.AIR) {
        let [localX, localY, localZ] = getCoords(idx);

        let cube = new CubeGeometry(
          this,
          BLOCK_DATA[blockType].uv,
          BLOCK_DATA[blockType].color,
          BLOCK_DATA[blockType].texWeight
        );

        cube.transformMatrix.scale(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        cube.transformMatrix.translate(this.originX, this.originY, this.originZ);
        cube.transformMatrix.translate(localX, localY, localZ);

        cube.addToChunkBuffer();
      }
    }

    let vertexArray = new Float32Array(this.vertexData);
    this.vertexCount = this.vertexData.length / 13;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
  }

  drawChunk(attrPosition, attrUV, attrColor, attrTexWeight, attrNormal) {
    const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const STRIDE = 13;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

    this.gl.vertexAttribPointer(attrPosition, 3, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, 0);
    this.gl.enableVertexAttribArray(attrPosition);

    this.gl.vertexAttribPointer(attrUV, 2, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 3);
    this.gl.enableVertexAttribArray(attrUV);

    this.gl.vertexAttribPointer(attrColor, 4, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 5);
    this.gl.enableVertexAttribArray(attrColor);

    this.gl.vertexAttribPointer(attrTexWeight, 1, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 9);
    this.gl.enableVertexAttribArray(attrTexWeight);

    this.gl.vertexAttribPointer(attrNormal, 3, this.gl.FLOAT, false, FLOAT_SIZE * STRIDE, FLOAT_SIZE * 10);
    this.gl.enableVertexAttribArray(attrNormal);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
  }

  build() {
    this.rebuildGeometry();
  }

  render(a_Position, a_UV, a_Color, a_texColorWeight, a_Normal) {
    this.drawChunk(a_Position, a_UV, a_Color, a_texColorWeight, a_Normal);
  }
}
