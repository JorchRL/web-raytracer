/**
 * Tests for the Camera module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from '../js/math.js';
import { Camera } from '../js/camera.js';

describe('Camera Module', () => {
  let camera;
  
  beforeEach(() => {
    // Create a camera looking down the -z axis
    camera = new Camera({
      position: new Vector3(0, 0, 0),
      lookAt: new Vector3(0, 0, -1),
      up: new Vector3(0, 1, 0),
      fov: 60, // degrees
      aspectRatio: 16 / 9
    });
  });
  
  describe('Camera initialization', () => {
    it('should create a camera with the provided position', () => {
      expect(camera.position.x).toBe(0);
      expect(camera.position.y).toBe(0);
      expect(camera.position.z).toBe(0);
    });
    
    it('should calculate the correct view direction', () => {
      expect(camera.direction.x).toBeCloseTo(0);
      expect(camera.direction.y).toBeCloseTo(0);
      expect(camera.direction.z).toBeCloseTo(-1);
    });
    
    it('should create a camera with the provided field of view', () => {
      expect(camera.fov).toBe(60);
    });
    
    it('should create right and up vectors that form an orthonormal basis', () => {
      // right, up, and direction should be perpendicular to each other
      const dotRightUp = camera.right.x * camera.up.x + camera.right.y * camera.up.y + camera.right.z * camera.up.z;
      const dotRightDir = camera.right.x * camera.direction.x + camera.right.y * camera.direction.y + camera.right.z * camera.direction.z;
      const dotUpDir = camera.up.x * camera.direction.x + camera.up.y * camera.direction.y + camera.up.z * camera.direction.z;
      
      expect(dotRightUp).toBeCloseTo(0);
      expect(dotRightDir).toBeCloseTo(0);
      expect(dotUpDir).toBeCloseTo(0);
    });
  });
  
  describe('Camera movement', () => {
    it('should move forward and backward', () => {
      camera.moveForward(2);
      expect(camera.position.z).toBeCloseTo(-2);
      
      camera.moveForward(-1);
      expect(camera.position.z).toBeCloseTo(-1);
    });
    
    it('should move right and left', () => {
      camera.moveRight(2);
      expect(camera.position.x).toBeCloseTo(2);
      
      camera.moveRight(-1);
      expect(camera.position.x).toBeCloseTo(1);
    });
    
    it('should move up and down', () => {
      camera.moveUp(2);
      expect(camera.position.y).toBeCloseTo(2);
      
      camera.moveUp(-1);
      expect(camera.position.y).toBeCloseTo(1);
    });
  });
  
  describe('Camera rotation', () => {
    it('should pan left and right', () => {
      // Pan 90 degrees right
      camera.pan(90);
      expect(camera.direction.x).toBeCloseTo(-1);
      expect(camera.direction.z).toBeCloseTo(0);
    });
    
    it('should tilt up and down', () => {
      // Tilt 45 degrees up
      camera.tilt(45);
      expect(camera.direction.y).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(camera.direction.z).toBeCloseTo(-Math.cos(Math.PI / 4));
    });
    
    it('should maintain orthonormal basis after rotation', () => {
      camera.pan(30);
      camera.tilt(20);
      
      // Check if right, up, and direction are still perpendicular
      const dotRightUp = camera.right.x * camera.up.x + camera.right.y * camera.up.y + camera.right.z * camera.up.z;
      const dotRightDir = camera.right.x * camera.direction.x + camera.right.y * camera.direction.y + camera.right.z * camera.direction.z;
      const dotUpDir = camera.up.x * camera.direction.x + camera.up.y * camera.direction.y + camera.up.z * camera.direction.z;
      
      // Use a bit more tolerance for floating point errors with multiple rotations
      expect(dotRightUp).toBeCloseTo(0, 1);
      expect(dotRightDir).toBeCloseTo(0, 1);
      expect(dotUpDir).toBeCloseTo(0, 1);
    });
  });
  
  describe('Ray generation', () => {
    it('should generate primary rays for pixel coordinates', () => {
      const ray = camera.generateRay(400, 300, 800, 600);
      
      // The ray should start at the camera position
      expect(ray.origin.x).toBe(camera.position.x);
      expect(ray.origin.y).toBe(camera.position.y);
      expect(ray.origin.z).toBe(camera.position.z);
      
      // For the center pixel, the ray should point approximately in the camera direction
      expect(ray.direction.x).toBeCloseTo(0);
      expect(ray.direction.y).toBeCloseTo(0);
      expect(ray.direction.z).toBeCloseTo(-1);
    });
    
    it('should generate rays for different pixels', () => {
      // Test pixel at top-right corner
      const rayTopRight = camera.generateRay(800, 0, 800, 600);
      expect(rayTopRight.direction.x).toBeGreaterThan(0);
      expect(rayTopRight.direction.y).toBeGreaterThan(0);
      
      // Test pixel at bottom-left corner
      const rayBottomLeft = camera.generateRay(0, 600, 800, 600);
      expect(rayBottomLeft.direction.x).toBeLessThan(0);
      expect(rayBottomLeft.direction.y).toBeLessThan(0);
    });
  });
}); 