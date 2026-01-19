// Triangle.js - Triangle class for rendering triangles

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 20.0;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size / 200.0; // Scale size appropriately
    
    // Pass the color to the fragment shader
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Set point size to 1.0 to prevent point artifacts on vertices
    gl.uniform1f(u_Size, 1.0);
    
    // Create triangle vertices centered at position
    let d = size;
    let vertices = new Float32Array([
      xy[0], xy[1] + d,           // Top vertex
      xy[0] - d, xy[1] - d,       // Bottom left
      xy[0] + d, xy[1] - d        // Bottom right
    ]);
    
    // Create and bind buffer
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create buffer for triangle');
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
}
