// DrawTriangle.js (c) 2012 matsuda

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var scale = 20;
  var endX = centerX + v.elements[0] * scale;
  var endY = centerY - v.elements[1] * scale;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function angleBetween(v1, v2) {
  var dotProduct = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  var cosAngle = dotProduct / (mag1 * mag2);
  var angleRadians = Math.acos(cosAngle);
  var angleDegrees = angleRadians * 180 / Math.PI;
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  var crossProduct = Vector3.cross(v1, v2);
  var area = crossProduct.magnitude() / 2;
  return area;
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
  var operation = document.getElementById('operation').value;
  if (operation === 'add') {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (operation === 'sub') {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (operation === 'mul') {
    var scalar = parseFloat(document.getElementById('scalar').value);
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.mul(scalar);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'div') {
    var scalar = parseFloat(document.getElementById('scalar').value);
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.div(scalar);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'magnitude') {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    console.log('Magnitude v1: ' + mag1);
    console.log('Magnitude v2: ' + mag2);
  } else if (operation === 'normalize') {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.normalize();
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'angleBetween') {
    var angle = angleBetween(v1, v2);
    console.log('Angle between v1 and v2: ' + angle + ' degrees');
  } else if (operation === 'area') {
    var area = areaTriangle(v1, v2);
    console.log('Area of triangle: ' + area);
  }
}

function main() {  
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
