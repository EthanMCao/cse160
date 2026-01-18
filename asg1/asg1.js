// asg1.js - WebGL Paint Application
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Current settings
let currentColor = [1.0, 0.0, 0.0, 1.0]; // RGBA
let currentSize = 10.0;
let currentDrawMode = 'point'; // 'point', 'triangle', 'circle'
let currentSegments = 10;

// Shape list
let shapesList = [];

function main() {
  // Setup WebGL
  setupWebGL();
  
  // Connect variables to GLSL
  connectVariablesToGLSL();
  
  // Register mouse event handlers
  canvas.onmousedown = handleClick;
  canvas.onmousemove = handleClick;
  
  // Specify the color for clearing canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  // Retrieve canvas element
  canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
  
  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  
  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function handleClick(ev) {
  // Only draw on mouse down or when dragging with button pressed
  if (ev.type === 'mousemove' && ev.buttons !== 1) {
    return;
  }
  
  // Convert mouse coordinates to WebGL coordinates
  let [x, y] = convertCoordinates(ev);
  
  // Create the appropriate shape based on current mode
  let shape;
  if (currentDrawMode === 'point') {
    shape = new Point();
    shape.position = [x, y];
    shape.color = currentColor.slice();
    shape.size = currentSize;
  } else if (currentDrawMode === 'triangle') {
    shape = new Triangle();
    shape.position = [x, y];
    shape.color = currentColor.slice();
    shape.size = currentSize;
  } else if (currentDrawMode === 'circle') {
    shape = new Circle();
    shape.position = [x, y];
    shape.color = currentColor.slice();
    shape.size = currentSize;
    shape.segments = currentSegments;
  }
  
  // Add shape to list
  shapesList.push(shape);
  
  // Render all shapes
  renderAllShapes();
}

function convertCoordinates(ev) {
  let x = ev.clientX; // x coordinate of mouse pointer
  let y = ev.clientY; // y coordinate of mouse pointer
  let rect = ev.target.getBoundingClientRect();
  
  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
  
  return [x, y];
}

function renderAllShapes() {
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Render each shape
  for (let shape of shapesList) {
    shape.render();
  }
}

// UI event handlers
function setDrawMode(mode) {
  currentDrawMode = mode;
  
  // Update button styles
  document.getElementById('pointBtn').classList.remove('active');
  document.getElementById('triangleBtn').classList.remove('active');
  document.getElementById('circleBtn').classList.remove('active');
  
  if (mode === 'point') {
    document.getElementById('pointBtn').classList.add('active');
  } else if (mode === 'triangle') {
    document.getElementById('triangleBtn').classList.add('active');
  } else if (mode === 'circle') {
    document.getElementById('circleBtn').classList.add('active');
  }
}

function updateColor() {
  let r = document.getElementById('redSlider').value / 100;
  let g = document.getElementById('greenSlider').value / 100;
  let b = document.getElementById('blueSlider').value / 100;
  
  currentColor = [r, g, b, 1.0];
  
  // Update display values
  document.getElementById('redValue').textContent = document.getElementById('redSlider').value;
  document.getElementById('greenValue').textContent = document.getElementById('greenSlider').value;
  document.getElementById('blueValue').textContent = document.getElementById('blueSlider').value;
}

function updateSize() {
  currentSize = parseFloat(document.getElementById('sizeSlider').value);
  document.getElementById('sizeValue').textContent = currentSize;
}

function updateSegments() {
  currentSegments = parseInt(document.getElementById('segmentsSlider').value);
  document.getElementById('segmentsValue').textContent = currentSegments;
}

function clearCanvas() {
  shapesList = [];
  renderAllShapes();
}

function drawPicture() {
  // Clear the canvas first
  shapesList = [];
  
  // Create a custom picture using triangles
  // Drawing initials "EB" with decorative triangles
  
  // Letter E (using triangles)
  // Vertical bar of E
  addTriangleToPicture(-0.6, 0.3, -0.5, 0.3, -0.55, 0.4, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.6, 0.2, -0.5, 0.2, -0.55, 0.3, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.6, 0.1, -0.5, 0.1, -0.55, 0.2, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.6, 0.0, -0.5, 0.0, -0.55, 0.1, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.6, -0.1, -0.5, -0.1, -0.55, 0.0, [0.8, 0.2, 0.8]);
  
  // Top horizontal of E
  addTriangleToPicture(-0.5, 0.3, -0.4, 0.3, -0.45, 0.35, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.4, 0.3, -0.3, 0.3, -0.35, 0.35, [0.8, 0.2, 0.8]);
  
  // Middle horizontal of E
  addTriangleToPicture(-0.5, 0.1, -0.4, 0.1, -0.45, 0.15, [0.8, 0.2, 0.8]);
  
  // Bottom horizontal of E
  addTriangleToPicture(-0.5, -0.1, -0.4, -0.1, -0.45, -0.05, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.4, -0.1, -0.3, -0.1, -0.35, -0.05, [0.8, 0.2, 0.8]);
  
  // Letter B (using triangles)
  // Vertical bar of B
  addTriangleToPicture(-0.1, 0.3, 0.0, 0.3, -0.05, 0.4, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.1, 0.2, 0.0, 0.2, -0.05, 0.3, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.1, 0.1, 0.0, 0.1, -0.05, 0.2, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.1, 0.0, 0.0, 0.0, -0.05, 0.1, [0.8, 0.2, 0.8]);
  addTriangleToPicture(-0.1, -0.1, 0.0, -0.1, -0.05, 0.0, [0.8, 0.2, 0.8]);
  
  // Top curve of B
  addTriangleToPicture(0.0, 0.3, 0.1, 0.25, 0.05, 0.3, [0.8, 0.2, 0.8]);
  addTriangleToPicture(0.1, 0.25, 0.1, 0.15, 0.05, 0.2, [0.8, 0.2, 0.8]);
  addTriangleToPicture(0.1, 0.15, 0.0, 0.1, 0.05, 0.125, [0.8, 0.2, 0.8]);
  
  // Bottom curve of B
  addTriangleToPicture(0.0, 0.1, 0.15, 0.05, 0.075, 0.1, [0.8, 0.2, 0.8]);
  addTriangleToPicture(0.15, 0.05, 0.15, -0.05, 0.1, 0.0, [0.8, 0.2, 0.8]);
  addTriangleToPicture(0.15, -0.05, 0.0, -0.1, 0.075, -0.075, [0.8, 0.2, 0.8]);
  
  // Decorative blue triangles around the letters
  addTriangleToPicture(-0.8, 0.5, -0.75, 0.45, -0.7, 0.5, [0.3, 0.5, 0.9]);
  addTriangleToPicture(-0.5, 0.6, -0.45, 0.5, -0.4, 0.6, [0.3, 0.5, 0.9]);
  addTriangleToPicture(-0.2, 0.55, -0.15, 0.5, -0.1, 0.55, [0.3, 0.5, 0.9]);
  addTriangleToPicture(0.2, 0.5, 0.25, 0.45, 0.3, 0.5, [0.3, 0.5, 0.9]);
  
  addTriangleToPicture(-0.8, -0.2, -0.75, -0.3, -0.7, -0.2, [0.3, 0.5, 0.9]);
  addTriangleToPicture(-0.5, -0.3, -0.45, -0.4, -0.4, -0.3, [0.3, 0.5, 0.9]);
  addTriangleToPicture(-0.2, -0.25, -0.15, -0.35, -0.1, -0.25, [0.3, 0.5, 0.9]);
  addTriangleToPicture(0.3, -0.2, 0.35, -0.3, 0.4, -0.2, [0.3, 0.5, 0.9]);
  
  addTriangleToPicture(0.5, 0.3, 0.55, 0.2, 0.6, 0.3, [0.3, 0.5, 0.9]);
  addTriangleToPicture(0.6, 0.0, 0.65, -0.1, 0.7, 0.0, [0.3, 0.5, 0.9]);
  addTriangleToPicture(0.5, -0.4, 0.55, -0.5, 0.6, -0.4, [0.3, 0.5, 0.9]);
  
  // Render all shapes
  renderAllShapes();
}

function addTriangleToPicture(x1, y1, x2, y2, x3, y3, color) {
  // Create a custom triangle with specific vertices
  let triangle = {
    type: 'custom_triangle',
    vertices: [x1, y1, x2, y2, x3, y3],
    color: [color[0], color[1], color[2], 1.0],
    render: function() {
      // Pass the color to the fragment shader
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      
      // Create triangle vertices
      let vertices = new Float32Array(this.vertices);
      
      // Create and bind buffer
      let vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create buffer for custom triangle');
        return;
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      
      // Assign buffer to a_Position and enable
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      
      // Draw the triangle
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
  
  shapesList.push(triangle);
}
