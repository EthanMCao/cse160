// Triangle.js - Triangle shape class

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 0.1;
  }
  
  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size / 100.0; // Scale size appropriately
    
    // Pass the color to u_FragColor uniform
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Create triangle vertices centered at position
    var d = size;
    var vertices = new Float32Array([
      xy[0], xy[1] + d,           // Top vertex
      xy[0] - d, xy[1] - d,       // Bottom left
      xy[0] + d, xy[1] - d        // Bottom right
    ]);
    
    // Create a buffer object
    var n = 3; // Number of vertices
    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
    
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    
    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}

