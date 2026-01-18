// Circle.js - Circle shape class

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 0.1;
    this.segments = 10;
  }
  
  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size / 100.0; // Scale size appropriately
    
    // Pass the color to u_FragColor uniform
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Create circle vertices
    var vertices = [xy[0], xy[1]]; // Center point
    
    // Calculate vertices around the circle
    for (var i = 0; i <= this.segments; i++) {
      var angle = (i * 2 * Math.PI) / this.segments;
      var x = xy[0] + size * Math.cos(angle);
      var y = xy[1] + size * Math.sin(angle);
      vertices.push(x, y);
    }
    
    var verticesFloat = new Float32Array(vertices);
    
    // Create a buffer object
    var n = vertices.length / 2; // Number of vertices
    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
    
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, verticesFloat, gl.DYNAMIC_DRAW);
    
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    
    // Draw the circle using TRIANGLE_FAN
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
  }
}

