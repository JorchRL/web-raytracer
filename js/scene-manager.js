/**
 * Scene management functionality
 */
import { Vector3 } from './math.js';
import { Material, Sphere, Plane, Light } from './raytracer.js';
import { CheckerboardTexture } from './textures.js';

/**
 * Manages a scene and provides operations to update objects
 */
export class SceneManager {
  /**
   * Creates a new scene manager
   * @param {Scene} scene - The scene to manage
   */
  constructor(scene) {
    this.scene = scene;
    this.objects = new Map(); // Maps object IDs to objects
    this.nextId = 1;
  }
  
  /**
   * Generate a unique ID for an object
   * @returns {string} - A unique ID
   * @private
   */
  _generateId() {
    return `obj_${this.nextId++}`;
  }
  
  /**
   * Add an object to the scene
   * @param {Object} object - The object to add
   * @returns {string} - The ID of the added object
   */
  addObject(object) {
    // If the object has a "type" property, it's a specification rather than an actual object
    if (object.type === 'sphere') {
      // Create a sphere from the specification
      object = new Sphere(
        object.center || new Vector3(0, 0, 0),
        object.radius || 1,
        object.material || new Material({ r: 1, g: 1, b: 1 })
      );
    } else if (object.type === 'plane') {
      // Create a plane from the specification
      object = new Plane(
        object.point || new Vector3(0, -1, 0),
        object.normal || new Vector3(0, 1, 0),
        object.material || new Material({ r: 1, g: 1, b: 1 })
      );
    }
    
    const id = this._generateId();
    this.objects.set(id, object);
    this.scene.addObject(object);
    return id;
  }
  
  /**
   * Get an object by ID
   * @param {string} id - The ID of the object to get
   * @returns {Object|null} - The object, or null if not found
   */
  getObject(id) {
    return this.objects.get(id) || null;
  }
  
  /**
   * Remove an object from the scene
   * @param {string} id - The ID of the object to remove
   * @returns {boolean} - Whether the object was removed
   */
  removeObject(id) {
    const object = this.objects.get(id);
    if (!object) {
      return false;
    }
    
    // Remove from the scene
    const index = this.scene.objects.indexOf(object);
    if (index !== -1) {
      this.scene.objects.splice(index, 1);
    }
    
    // Remove from our map
    this.objects.delete(id);
    return true;
  }
  
  /**
   * Update the position of an object
   * @param {string} id - The ID of the object to update
   * @param {Vector3} position - The new position
   * @returns {boolean} - Whether the update was successful
   */
  updateObjectPosition(id, position) {
    const object = this.objects.get(id);
    if (!object) {
      return false;
    }
    
    // Different objects store position differently
    if (object instanceof Sphere) {
      object.center = position;
    } else if (object instanceof Plane) {
      object.point = position;
    }
    
    return true;
  }
  
  /**
   * Update the radius of a sphere
   * @param {string} id - The ID of the sphere to update
   * @param {number} radius - The new radius
   * @returns {boolean} - Whether the update was successful
   */
  updateSphereRadius(id, radius) {
    const object = this.objects.get(id);
    if (!object || !(object instanceof Sphere)) {
      return false;
    }
    
    object.radius = radius;
    return true;
  }
  
  /**
   * Update the material of an object
   * @param {string} id - The ID of the object to update
   * @param {Material} material - The new material
   * @returns {boolean} - Whether the update was successful
   */
  updateObjectMaterial(id, material) {
    const object = this.objects.get(id);
    if (!object) {
      return false;
    }
    
    object.material = material;
    return true;
  }
  
  /**
   * Update just the color of an object's material
   * @param {string} id - The ID of the object to update
   * @param {Object} color - The new RGB color
   * @returns {boolean} - Whether the update was successful
   */
  updateObjectColor(id, color) {
    const object = this.objects.get(id);
    if (!object || !object.material) {
      return false;
    }
    
    object.material.color = color;
    return true;
  }
  
  /**
   * Clear all objects from the scene
   */
  clearScene() {
    this.scene.objects = [];
    this.objects.clear();
  }
  
  /**
   * Create a default scene with some objects
   */
  createDefaultScene() {
    this.clearScene();
    
    // Red sphere
    this.addObject(new Sphere(
      new Vector3(0, 0, 5),
      1,
      new Material({ r: 1, g: 0.1, b: 0.1 })
    ));
    
    // Blue sphere
    this.addObject(new Sphere(
      new Vector3(-1.2, 0.5, 4),
      0.7,
      new Material({ r: 0.1, g: 0.4, b: 1 })
    ));
    
    // Green sphere
    this.addObject(new Sphere(
      new Vector3(1.2, 0.3, 3.5),
      0.5,
      new Material({ r: 0.1, g: 0.8, b: 0.1 })
    ));
    
    // Floor plane
    this.addObject(new Plane(
      new Vector3(0, -1, 0),
      new Vector3(0, 1, 0),
      new Material({ r: 0.8, g: 0.8, b: 0.8 })
    ));
  }

  /**
   * Create a Cornell box scene
   * The Cornell box is a standard test scene in computer graphics,
   * consisting of a box with colored walls and simple objects inside
   */
  createCornellBox() {
    this.clearScene();
    
    const WALL_SIZE = 5; // Size of the box
    const HALF_SIZE = WALL_SIZE / 2;
    
    // Floor (white with checkerboard pattern)
    const floorTexture = new CheckerboardTexture(
      { r: 0.9, g: 0.9, b: 0.9 },   // White
      { r: 0.2, g: 0.2, b: 0.2 },   // Dark gray
      5                              // Scale
    );
    
    this.addObject(new Plane(
      new Vector3(0, -HALF_SIZE, 0),
      new Vector3(0, 1, 0),
      new Material({ r: 0.9, g: 0.9, b: 0.9 }, { 
        diffuse: 0.7, 
        specular: 0.3, 
        reflection: 0.2,
        texture: floorTexture
      })
    ));
    
    // Ceiling (white)
    this.addObject(new Plane(
      new Vector3(0, HALF_SIZE, 0),
      new Vector3(0, -1, 0),
      new Material({ r: 0.9, g: 0.9, b: 0.9 }, { diffuse: 0.8, specular: 0.2 })
    ));
    
    // Back wall (white)
    this.addObject(new Plane(
      new Vector3(0, 0, HALF_SIZE + 5), // Add 5 to move it back
      new Vector3(0, 0, -1),
      new Material({ r: 0.9, g: 0.9, b: 0.9 }, { diffuse: 0.8, specular: 0.2 })
    ));
    
    // Left wall (red)
    this.addObject(new Plane(
      new Vector3(-HALF_SIZE, 0, 0),
      new Vector3(1, 0, 0),
      new Material({ r: 0.9, g: 0.1, b: 0.1 }, { diffuse: 0.8, specular: 0.2 })
    ));
    
    // Right wall (green)
    this.addObject(new Plane(
      new Vector3(HALF_SIZE, 0, 0),
      new Vector3(-1, 0, 0),
      new Material({ r: 0.1, g: 0.9, b: 0.1 }, { diffuse: 0.8, specular: 0.2 })
    ));
    
    // Highly reflective sphere (like a mirror)
    this.addObject(new Sphere(
      new Vector3(-HALF_SIZE * 0.5, -HALF_SIZE + 1, HALF_SIZE * 0.5 + 5),
      1,
      new Material({ r: 0.9, g: 0.9, b: 0.9 }, { 
        diffuse: 0.1, 
        specular: 0.9, 
        shininess: 64,
        reflection: 0.8  // High reflection for a mirror-like surface
      })
    ));
    
    // Glass sphere (transparent with refraction)
    this.addObject(new Sphere(
      new Vector3(HALF_SIZE * 0.5, -HALF_SIZE + 0.5, HALF_SIZE * 0.8 + 5),
      0.5,
      new Material({ r: 0.8, g: 0.8, b: 0.9 }, { 
        diffuse: 0.1, 
        specular: 0.9,
        shininess: 64,
        reflection: 0.1,
        transparency: 0.9,  // Highly transparent
        refractiveIndex: 1.5  // Glass-like refractive index
      })
    ));
    
    // Add a small matte sphere as well
    this.addObject(new Sphere(
      new Vector3(0, -HALF_SIZE + 0.3, HALF_SIZE * 1.2 + 5),
      0.3,
      new Material({ r: 0.9, g: 0.2, b: 0.1 }, { 
        diffuse: 0.9, 
        specular: 0.1,
        reflection: 0.0
      })
    ));
    
    // Add a main ceiling light (point light)
    this.scene.addLight(new Light('point', {
      position: new Vector3(0, HALF_SIZE - 0.5, HALF_SIZE * 0.5 + 5),
      color: { r: 1, g: 1, b: 1 },
      intensity: 1.0
    }));
    
    // Add a secondary light to the left (point light)
    this.scene.addLight(new Light('point', {
      position: new Vector3(-HALF_SIZE + 1, 0, HALF_SIZE * 0.5 + 4),
      color: { r: 0.9, g: 0.8, b: 0.7 },
      intensity: 0.5
    }));
    
    // Add a directional light for subtle fill (like ambient occlusion)
    this.scene.addLight(new Light('directional', {
      direction: new Vector3(0.5, -1, 0.5),
      color: { r: 0.2, g: 0.2, b: 0.3 },
      intensity: 0.2
    }));
    
    return this.scene;
  }
} 