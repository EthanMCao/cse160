// Circle.js - Circle class for rendering circles

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 20.0;
    this.segments = 10;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let radius = this.size / 200.0;
    let segments = this.segments;
    
    // Pass the color to the fragment shader
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Create circle using triangle fan
    // Center vertex + perimeter vertices + closing vertex
    let vertices = [];
    
    // Center point
    vertices.push(xy[0], xy[1]);
    
    // Perimeter points
    for (let i = 0; i <= segments; i++) {
      let angle = (i * 2 * Math.PI) / segments;
      let x = xy[0] + radius * Math.cos(angle);
      let y = xy[1] + radius * Math.sin(angle);
      vertices.push(x, y);
    }
    
    let verticesArray = new Float32Array(vertices);
    
    // Create and bind buffer
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create buffer for circle');
      return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.DYNAMIC_DRAW);
    
    // Assign buffer to a_Position and enable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Draw the circle using TRIANGLE_FAN
    gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
  }
}
