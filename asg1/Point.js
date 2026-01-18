// Point.js - Point class for rendering points

class Point {
  constructor() {
    this.type = 'point';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;
    
    // Pass the position to the vertex shader
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    
    // Pass the color to the fragment shader
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Pass the size to the vertex shader
    gl.uniform1f(u_Size, size);
    
    // Draw the point
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}
