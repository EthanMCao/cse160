// asg1.js - WebGL Paint Program
// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
   uniform float u_Size;
   void main() {
     gl_Position = a_Position;
     gl_PointSize = u_Size;
   }`;

// Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
   uniform vec4 u_FragColor;
   void main() {
     gl_FragColor = u_FragColor;
   }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Shape storage
let shapesList = [];

// Current drawing settings
let currentColor = [1.0, 0.0, 0.0, 1.0]; // Red
let currentSize = 10;
let currentSegments = 10;
let currentDrawMode = 'point'; // 'point', 'triangle', 'circle'

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHTMLUI();
  
  // Register mouse event handlers
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  
  // Clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  console.log('WebGL Paint Program initialized');
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  
  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
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

function addActionsForHTMLUI() {
  // Color sliders are already connected via oninput in HTML
  // Initial display update
  updateColor();
  updateSize();
  updateSegments();
}

// Convert canvas coordinates to WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of mouse pointer
  var y = ev.clientY; // y coordinate of mouse pointer
  var rect = ev.target.getBoundingClientRect();
  
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
  return [x, y];
}

// Mouse event handlers
let isMouseDown = false;

function handleMouseDown(ev) {
  isMouseDown = true;
  let [x, y] = convertCoordinatesEventToGL(ev);
  
  // Create and add shape
  if (currentDrawMode === 'point') {
    let point = new Point();
    point.position = [x, y];
    point.color = currentColor.slice();
    point.size = currentSize;
    shapesList.push(point);
  } else if (currentDrawMode === 'triangle') {
    let triangle = new Triangle();
    triangle.position = [x, y];
    triangle.color = currentColor.slice();
    triangle.size = currentSize;
    shapesList.push(triangle);
  } else if (currentDrawMode === 'circle') {
    let circle = new Circle();
    circle.position = [x, y];
    circle.color = currentColor.slice();
    circle.size = currentSize;
    circle.segments = currentSegments;
    shapesList.push(circle);
  }
  
  renderAllShapes();
}

function handleMouseMove(ev) {
  if (isMouseDown) {
    let [x, y] = convertCoordinatesEventToGL(ev);
    
    // Create and add shape
    if (currentDrawMode === 'point') {
      let point = new Point();
      point.position = [x, y];
      point.color = currentColor.slice();
      point.size = currentSize;
      shapesList.push(point);
    } else if (currentDrawMode === 'triangle') {
      let triangle = new Triangle();
      triangle.position = [x, y];
      triangle.color = currentColor.slice();
      triangle.size = currentSize;
      shapesList.push(triangle);
    } else if (currentDrawMode === 'circle') {
      let circle = new Circle();
      circle.position = [x, y];
      circle.color = currentColor.slice();
      circle.size = currentSize;
      circle.segments = currentSegments;
      shapesList.push(circle);
    }
    
    renderAllShapes();
  }
}

function handleMouseUp(ev) {
  isMouseDown = false;
}

function renderAllShapes() {
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Render all shapes
  for (let i = 0; i < shapesList.length; i++) {
    shapesList[i].render();
  }
}

// UI Control Functions
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
  // Custom picture: Letter "E" and "T" with decorative triangles
  // This creates a stylized design featuring the initials "ET"
  
  // Letter E (using triangles)
  // Vertical bar of E
  drawCustomTriangle(-0.6, 0.5, -0.6, 0.3, -0.5, 0.4, [0.2, 0.6, 1.0, 1.0]); // Blue
  drawCustomTriangle(-0.6, 0.3, -0.6, 0.1, -0.5, 0.2, [0.2, 0.6, 1.0, 1.0]);
  drawCustomTriangle(-0.6, 0.1, -0.6, -0.1, -0.5, 0.0, [0.2, 0.6, 1.0, 1.0]);
  drawCustomTriangle(-0.6, -0.1, -0.6, -0.3, -0.5, -0.2, [0.2, 0.6, 1.0, 1.0]);
  drawCustomTriangle(-0.6, -0.3, -0.6, -0.5, -0.5, -0.4, [0.2, 0.6, 1.0, 1.0]);
  
  // Top horizontal bar of E
  drawCustomTriangle(-0.5, 0.5, -0.3, 0.5, -0.4, 0.4, [0.3, 0.7, 1.0, 1.0]);
  drawCustomTriangle(-0.3, 0.5, -0.1, 0.5, -0.2, 0.4, [0.3, 0.7, 1.0, 1.0]);
  
  // Middle horizontal bar of E
  drawCustomTriangle(-0.5, 0.0, -0.3, 0.0, -0.4, -0.1, [0.3, 0.7, 1.0, 1.0]);
  drawCustomTriangle(-0.3, 0.0, -0.15, 0.0, -0.25, -0.1, [0.3, 0.7, 1.0, 1.0]);
  
  // Bottom horizontal bar of E
  drawCustomTriangle(-0.5, -0.5, -0.3, -0.5, -0.4, -0.4, [0.3, 0.7, 1.0, 1.0]);
  drawCustomTriangle(-0.3, -0.5, -0.1, -0.5, -0.2, -0.4, [0.3, 0.7, 1.0, 1.0]);
  
  // Letter T (using triangles)
  // Top horizontal bar of T
  drawCustomTriangle(0.0, 0.5, 0.2, 0.5, 0.1, 0.4, [1.0, 0.4, 0.6, 1.0]); // Pink
  drawCustomTriangle(0.2, 0.5, 0.4, 0.5, 0.3, 0.4, [1.0, 0.4, 0.6, 1.0]);
  drawCustomTriangle(0.4, 0.5, 0.6, 0.5, 0.5, 0.4, [1.0, 0.4, 0.6, 1.0]);
  
  // Vertical bar of T
  drawCustomTriangle(0.3, 0.4, 0.3, 0.2, 0.2, 0.3, [1.0, 0.5, 0.7, 1.0]);
  drawCustomTriangle(0.3, 0.2, 0.3, 0.0, 0.2, 0.1, [1.0, 0.5, 0.7, 1.0]);
  drawCustomTriangle(0.3, 0.0, 0.3, -0.2, 0.2, -0.1, [1.0, 0.5, 0.7, 1.0]);
  drawCustomTriangle(0.3, -0.2, 0.3, -0.4, 0.2, -0.3, [1.0, 0.5, 0.7, 1.0]);
  drawCustomTriangle(0.3, -0.4, 0.3, -0.5, 0.2, -0.45, [1.0, 0.5, 0.7, 1.0]);
  
  // Decorative triangles around the letters
  drawCustomTriangle(-0.8, 0.7, -0.75, 0.6, -0.7, 0.7, [1.0, 1.0, 0.3, 1.0]); // Yellow
  drawCustomTriangle(-0.8, -0.7, -0.75, -0.6, -0.7, -0.7, [1.0, 1.0, 0.3, 1.0]);
  drawCustomTriangle(0.7, 0.7, 0.75, 0.6, 0.8, 0.7, [1.0, 1.0, 0.3, 1.0]);
  drawCustomTriangle(0.7, -0.7, 0.75, -0.6, 0.8, -0.7, [1.0, 1.0, 0.3, 1.0]);
  
  // Additional decorative elements
  drawCustomTriangle(0.0, 0.75, 0.05, 0.65, -0.05, 0.65, [0.5, 1.0, 0.5, 1.0]); // Green
  drawCustomTriangle(-0.7, 0.0, -0.65, 0.1, -0.65, -0.1, [1.0, 0.7, 0.3, 1.0]); // Orange
  drawCustomTriangle(0.65, 0.0, 0.7, 0.1, 0.7, -0.1, [1.0, 0.7, 0.3, 1.0]);
  
  // Background accent triangles
  drawCustomTriangle(-0.85, 0.3, -0.8, 0.2, -0.8, 0.4, [0.4, 0.4, 0.8, 1.0]);
  drawCustomTriangle(0.8, 0.2, 0.85, 0.3, 0.85, 0.1, [0.8, 0.4, 0.4, 1.0]);
  
  renderAllShapes();
  console.log('Picture drawn with initials "ET"');
}

// Helper function to draw a custom triangle at specific coordinates
function drawCustomTriangle(x1, y1, x2, y2, x3, y3, color) {
  let triangle = new Triangle();
  // We'll create a custom triangle by directly specifying all vertices
  triangle.position = [x1, y1];
  triangle.color = color;
  triangle.size = 0; // We'll override the render to use custom vertices
  
  // Store custom vertices
  triangle.vertices = [x1, y1, x2, y2, x3, y3];
  
  // Override render method for this specific triangle
  triangle.render = function() {
    var rgba = this.color;
    
    // Pass the color to u_FragColor uniform
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    var vertices = new Float32Array(this.vertices);
    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  
  shapesList.push(triangle);
}

