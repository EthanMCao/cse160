// Camera.js - First-person camera with proper deltaTime

// Extend Vector3 with helper methods if they don't exist
if (!Vector3.prototype.set) {
  Vector3.prototype.set = function(other) {
    this.elements[0] = other.elements[0];
    this.elements[1] = other.elements[1];
    this.elements[2] = other.elements[2];
    return this;
  };
}

if (!Vector3.prototype.add) {
  Vector3.prototype.add = function(other) {
    this.elements[0] += other.elements[0];
    this.elements[1] += other.elements[1];
    this.elements[2] += other.elements[2];
    return this;
  };
}

if (!Vector3.prototype.sub) {
  Vector3.prototype.sub = function(other) {
    this.elements[0] -= other.elements[0];
    this.elements[1] -= other.elements[1];
    this.elements[2] -= other.elements[2];
    return this;
  };
}

if (!Vector3.prototype.mul) {
  Vector3.prototype.mul = function(scalar) {
    this.elements[0] *= scalar;
    this.elements[1] *= scalar;
    this.elements[2] *= scalar;
    return this;
  };
}

if (!Vector3.cross) {
  Vector3.cross = function(a, b) {
    let result = new Vector3();
    result.elements[0] = a.elements[1] * b.elements[2] - a.elements[2] * b.elements[1];
    result.elements[1] = a.elements[2] * b.elements[0] - a.elements[0] * b.elements[2];
    result.elements[2] = a.elements[0] * b.elements[1] - a.elements[1] * b.elements[0];
    return result;
  };
}

if (!Vector3.dot) {
  Vector3.dot = function(a, b) {
    return a.elements[0] * b.elements[0] + 
           a.elements[1] * b.elements[1] + 
           a.elements[2] * b.elements[2];
  };
}

class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = new Vector3([0, 2, 5]);  // Start position
    this.at = new Vector3([0, 2, 0]);   // Look at center
    this.up = new Vector3([0, 1, 0]);   // Y is up
    
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    
    this.canvas = canvas;
    this.updateMatrices();
  }
  
  updateMatrices() {
    this.viewMatrix.setLookAt(
      ...this.eye.elements,
      ...this.at.elements,
      ...this.up.elements
    );
    this.projectionMatrix.setPerspective(
      this.fov,
      this.canvas.width / this.canvas.height,
      0.1,
      1000
    );
  }
  
  moveForward(deltaTime) {
    let speed = 3.0;
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed * deltaTime);
    this.eye.add(f);
    this.at.add(f);
    this.updateMatrices();
  }
  
  moveBackwards(deltaTime) {
    let speed = 3.0;
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed * deltaTime);
    this.eye.sub(f);
    this.at.sub(f);
    this.updateMatrices();
  }
  
  moveLeft(deltaTime) {
    let speed = 3.0;
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    // Cross product: up x forward = left
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed * deltaTime);
    this.eye.add(s);
    this.at.add(s);
    this.updateMatrices();
  }
  
  moveRight(deltaTime) {
    let speed = 3.0;
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    // Cross product: forward x up = right
    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed * deltaTime);
    this.eye.add(s);
    this.at.add(s);
    this.updateMatrices();
  }
  
  panLeft(deltaTime) {
    let alpha = 90; // degrees per second
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      alpha * deltaTime,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
    let f_prime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateMatrices();
  }
  
  panRight(deltaTime) {
    let alpha = 90;
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      -alpha * deltaTime,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
    let f_prime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateMatrices();
  }
  
  // Mouse rotation with angle clamping
  panYawDegrees(angle) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      -angle,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
    let f_prime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateMatrices();
  }
  
  panPitchDegrees(angle) {
    let clampAngle = 5;  // Prevent looking straight up/down
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    
    // Check if we're hitting the clamp angle
    if (Vector3.dot(f, this.up) > Math.cos((clampAngle * Math.PI) / 180) && angle > 0) {
      return;
    }
    if (Vector3.dot(f, this.up) < -Math.cos((clampAngle * Math.PI) / 180) && angle < 0) {
      return;
    }
    
    // Get right vector for pitch rotation
    let right = Vector3.cross(this.up, f);
    right.normalize();
    
    let rotationMatrix = new Matrix4();
    rotationMatrix.rotate(-angle, right.elements[0], right.elements[1], right.elements[2]);
    let f_prime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateMatrices();
  }
  
  getForwardVector() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    return f;
  }
}
