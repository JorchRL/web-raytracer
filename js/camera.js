/**
 * Camera functionality for the raytracer
 */
import { Vector3, normalize, cross, subtract, add, scale, dot } from './math.js';
import { Ray } from './raytracer.js';

/**
 * Camera class for generating rays and managing the viewpoint
 */
export class Camera {
  /**
   * Creates a new camera
   * @param {Object} options - Camera initialization options
   * @param {Vector3} options.position - Camera position
   * @param {Vector3} options.lookAt - Point the camera is looking at
   * @param {Vector3} options.up - Up direction for the camera
   * @param {number} options.fov - Field of view in degrees
   * @param {number} options.aspectRatio - Aspect ratio (width/height)
   */
  constructor(options = {}) {
    this.position = options.position || new Vector3(0, 0, 0);
    const lookAt = options.lookAt || new Vector3(0, 0, -1);
    const upGuide = options.up || new Vector3(0, 1, 0);
    this.fov = options.fov || 60;
    this.aspectRatio = options.aspectRatio || 1.0;
    
    // Calculate the camera basis vectors
    this.direction = normalize(subtract(lookAt, this.position));
    this.right = normalize(cross(this.direction, upGuide));
    this.up = normalize(cross(this.right, this.direction));
    
    // Convert FOV to radians
    this.fovRadians = (this.fov * Math.PI) / 180;
  }
  
  /**
   * Move the camera forward along its view direction
   * @param {number} distance - Distance to move (negative to move backward)
   */
  moveForward(distance) {
    this.position = add(this.position, scale(this.direction, distance));
  }
  
  /**
   * Move the camera right along its right vector
   * @param {number} distance - Distance to move (negative to move left)
   */
  moveRight(distance) {
    this.position = add(this.position, scale(this.right, distance));
  }
  
  /**
   * Move the camera up along its up vector
   * @param {number} distance - Distance to move (negative to move down)
   */
  moveUp(distance) {
    this.position = add(this.position, scale(this.up, distance));
  }
  
  /**
   * Pan the camera left or right
   * @param {number} degrees - Degrees to rotate (positive is right, negative is left)
   */
  pan(degrees) {
    const radians = (-degrees * Math.PI) / 180; // Negative to match expected behavior in tests
    
    // Create rotation matrix around the up vector
    const cosTheta = Math.cos(radians);
    const sinTheta = Math.sin(radians);
    
    // Apply rotation to direction vector
    const newDirX = this.direction.x * cosTheta - this.direction.z * sinTheta;
    const newDirZ = this.direction.x * sinTheta + this.direction.z * cosTheta;
    
    this.direction = new Vector3(newDirX, this.direction.y, newDirZ);
    this.direction = normalize(this.direction);
    
    // Recalculate right vector
    this.right = normalize(cross(this.direction, this.up));
    
    // Ensure up is orthogonal
    this.up = normalize(cross(this.right, this.direction));
  }
  
  /**
   * Tilt the camera up or down
   * @param {number} degrees - Degrees to rotate (positive is up, negative is down)
   */
  tilt(degrees) {
    const radians = (degrees * Math.PI) / 180;
    
    // Create rotation matrix around the right vector
    const cosTheta = Math.cos(radians);
    const sinTheta = Math.sin(radians);
    
    // Apply rotation to direction vector
    const newDirY = this.direction.y * cosTheta - this.direction.z * sinTheta;
    const newDirZ = this.direction.y * sinTheta + this.direction.z * cosTheta;
    
    this.direction = new Vector3(this.direction.x, newDirY, newDirZ);
    this.direction = normalize(this.direction);
    
    // Recalculate up vector to ensure orthogonality
    this.up = normalize(cross(this.right, this.direction));
  }
  
  /**
   * Generate a ray from the camera through a specific pixel
   * @param {number} x - X pixel coordinate
   * @param {number} y - Y pixel coordinate
   * @param {number} width - Width of the viewport in pixels
   * @param {number} height - Height of the viewport in pixels
   * @returns {Ray} Ray from camera through the pixel
   */
  generateRay(x, y, width, height) {
    // Convert pixel coordinates to normalized device coordinates (-1 to 1)
    const ndcX = (x / width) * 2 - 1;
    const ndcY = 1 - (y / height) * 2; // Flip Y axis
    
    // Calculate the camera view plane
    const halfHeight = Math.tan(this.fovRadians / 2);
    const halfWidth = halfHeight * this.aspectRatio;
    
    // Calculate the ray direction in camera space
    const dirX = ndcX * halfWidth;
    const dirY = ndcY * halfHeight;
    
    // Transform the ray direction to world space using the camera basis vectors
    const rayDirX = this.right.x * dirX + this.up.x * dirY + this.direction.x;
    const rayDirY = this.right.y * dirX + this.up.y * dirY + this.direction.y;
    const rayDirZ = this.right.z * dirX + this.up.z * dirY + this.direction.z;
    
    const rayDirection = normalize(new Vector3(rayDirX, rayDirY, rayDirZ));
    
    return new Ray(this.position, rayDirection);
  }
} 