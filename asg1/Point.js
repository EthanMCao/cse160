// Point.js - Point shape class

class Point {
  constructor() {
    this.type = 'point';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }
  
  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    
    // Pass the position to a_Position attribute
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    
    // Pass the color to u_FragColor uniform
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Pass the size to u_Size uniform
    gl.uniform1f(u_Size, size);
    
    // Draw the point
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

