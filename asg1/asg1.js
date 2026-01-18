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
  // This will be implemented later with custom triangles
  console.log('Draw picture - to be implemented');
}
