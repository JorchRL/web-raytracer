/**
 * Tests for the SceneManager module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from '../js/math.js';
import { Scene, Sphere, Plane, Material } from '../js/raytracer.js';
import { SceneManager } from '../js/scene-manager.js';

describe('SceneManager Module', () => {
  let sceneManager;
  let scene;
  
  beforeEach(() => {
    scene = new Scene();
    sceneManager = new SceneManager(scene);
  });
  
  describe('Scene object management', () => {
    it('should add an object to the scene', () => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      
      const objectId = sceneManager.addObject(sphere);
      
      expect(objectId).toBeDefined();
      expect(sceneManager.getObject(objectId)).toBe(sphere);
      expect(scene.objects.length).toBe(1);
      expect(scene.objects[0]).toBe(sphere);
    });
    
    it('should remove an object from the scene', () => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      
      const objectId = sceneManager.addObject(sphere);
      expect(scene.objects.length).toBe(1);
      
      sceneManager.removeObject(objectId);
      expect(scene.objects.length).toBe(0);
    });
    
    it('should get an object by id', () => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      
      const objectId = sceneManager.addObject(sphere);
      
      const retrievedObject = sceneManager.getObject(objectId);
      expect(retrievedObject).toBe(sphere);
    });
    
    it('should return null when getting an invalid object id', () => {
      const retrievedObject = sceneManager.getObject('invalid-id');
      expect(retrievedObject).toBeNull();
    });
    
    it('should do nothing when removing an invalid object id', () => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      
      sceneManager.addObject(sphere);
      expect(scene.objects.length).toBe(1);
      
      sceneManager.removeObject('invalid-id');
      expect(scene.objects.length).toBe(1);
    });
  });
  
  describe('Object transformations', () => {
    let sphereId;
    
    beforeEach(() => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      sphereId = sceneManager.addObject(sphere);
    });
    
    it('should update an object position', () => {
      sceneManager.updateObjectPosition(sphereId, new Vector3(1, 2, 3));
      
      const sphere = sceneManager.getObject(sphereId);
      expect(sphere.center.x).toBe(1);
      expect(sphere.center.y).toBe(2);
      expect(sphere.center.z).toBe(3);
    });
    
    it('should update a sphere radius', () => {
      sceneManager.updateSphereRadius(sphereId, 2.5);
      
      const sphere = sceneManager.getObject(sphereId);
      expect(sphere.radius).toBe(2.5);
    });
    
    it('should do nothing when updating with an invalid id', () => {
      const sphere = sceneManager.getObject(sphereId);
      const originalPosition = sphere.center;
      
      sceneManager.updateObjectPosition('invalid-id', new Vector3(1, 2, 3));
      
      expect(sphere.center).toBe(originalPosition);
    });
  });
  
  describe('Material management', () => {
    let sphereId;
    
    beforeEach(() => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      sphereId = sceneManager.addObject(sphere);
    });
    
    it('should update an object material', () => {
      const blueMaterial = new Material({ r: 0, g: 0, b: 1 });
      
      sceneManager.updateObjectMaterial(sphereId, blueMaterial);
      
      const sphere = sceneManager.getObject(sphereId);
      expect(sphere.material).toBe(blueMaterial);
      expect(sphere.material.color.r).toBe(0);
      expect(sphere.material.color.g).toBe(0);
      expect(sphere.material.color.b).toBe(1);
    });
    
    it('should update just the material color', () => {
      sceneManager.updateObjectColor(sphereId, { r: 0.5, g: 0.5, b: 0.5 });
      
      const sphere = sceneManager.getObject(sphereId);
      expect(sphere.material.color.r).toBe(0.5);
      expect(sphere.material.color.g).toBe(0.5);
      expect(sphere.material.color.b).toBe(0.5);
    });
  });
  
  describe('Scene management', () => {
    it('should clear all objects from the scene', () => {
      const redMaterial = new Material({ r: 1, g: 0, b: 0 });
      const sphere = new Sphere(new Vector3(0, 0, 0), 1, redMaterial);
      
      const greenMaterial = new Material({ r: 0, g: 1, b: 0 });
      const plane = new Plane(new Vector3(0, -1, 0), new Vector3(0, 1, 0), greenMaterial);
      
      sceneManager.addObject(sphere);
      sceneManager.addObject(plane);
      expect(scene.objects.length).toBe(2);
      
      sceneManager.clearScene();
      expect(scene.objects.length).toBe(0);
    });
    
    it('should create a preset scene', () => {
      sceneManager.createDefaultScene();
      
      // Default scene should have at least a few objects
      expect(scene.objects.length).toBeGreaterThan(0);
    });

    it('should create a Cornell box scene', () => {
      sceneManager.createCornellBox();
      
      // Cornell box should have at least 7 objects (5 walls + 2 spheres)
      expect(scene.objects.length).toBeGreaterThanOrEqual(7);
      
      // Check if there are planes (walls) and spheres in the scene
      const walls = scene.objects.filter(obj => obj instanceof Plane);
      const spheres = scene.objects.filter(obj => obj instanceof Sphere);
      
      // Should have at least 5 walls (floor, ceiling, back wall, left wall, right wall)
      expect(walls.length).toBeGreaterThanOrEqual(5);
      
      // Should have at least 2 spheres (large and small sphere)
      expect(spheres.length).toBeGreaterThanOrEqual(2);
      
      // Check if the left wall is red and right wall is green
      const leftWall = walls.find(wall => wall.point.x < 0 && Math.abs(wall.normal.x) > 0.9);
      const rightWall = walls.find(wall => wall.point.x > 0 && Math.abs(wall.normal.x) > 0.9);
      
      expect(leftWall).toBeDefined();
      expect(rightWall).toBeDefined();
      
      // Left wall should be red (high r value, low g and b values)
      expect(leftWall.material.color.r).toBeGreaterThan(0.8);
      expect(leftWall.material.color.g).toBeLessThan(0.2);
      expect(leftWall.material.color.b).toBeLessThan(0.2);
      
      // Right wall should be green (high g value, low r and b values)
      expect(rightWall.material.color.r).toBeLessThan(0.2);
      expect(rightWall.material.color.g).toBeGreaterThan(0.8);
      expect(rightWall.material.color.b).toBeLessThan(0.2);
    });
  });
}); 