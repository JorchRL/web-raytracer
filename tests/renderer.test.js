/**
 * Renderer module tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rendererModule from '../js/renderer.js';
import * as gpuModule from '../js/gpu.js';

// Mock the GPU module
vi.mock('../js/gpu.js', () => ({
  createCommandEncoder: vi.fn(() => ({
    beginRenderPass: vi.fn(() => ({
      end: vi.fn()
    })),
    finish: vi.fn(() => ({}))
  })),
  createClearPassDescriptor: vi.fn((textureView, clearColor) => ({
    colorAttachments: [{
      view: textureView,
      clearValue: clearColor,
      loadOp: 'clear',
      storeOp: 'store'
    }]
  }))
}));

// Mock the camera module
vi.mock('../js/camera.js', () => ({
  Camera: class Camera {
    constructor() {}
    generateRay() {
      return { origin: {}, direction: {} };
    }
  }
}));

// Mock the scene-manager module
vi.mock('../js/scene-manager.js', () => ({
  SceneManager: class SceneManager {
    constructor() {}
    createDefaultScene() {}
    createCornellBox() {}
  }
}));

// Mock the raytracer module
vi.mock('../js/raytracer.js', () => ({
  Scene: class Scene {
    constructor() {
      this.objects = [];
      this.lights = [];
    }
    addObject() {}
    addLight() {}
  },
  Vector3: class Vector3 {
    constructor() {}
  },
  Sphere: class Sphere {
    constructor() {}
  },
  Plane: class Plane {
    constructor() {}
  },
  Material: class Material {
    constructor(color) {
      this.color = color;
    }
  },
  Light: class Light {
    constructor() {}
  },
  Ray: class Ray {
    constructor() {}
  },
  raytracePixel: vi.fn(() => ({ r: 0, g: 0, b: 0 })),
  normalize: vi.fn(v => v),
  computeRayIntersection: vi.fn(() => ({
    material: { color: { r: 0, g: 0, b: 0 } }
  })),
  calculateLighting: vi.fn(() => ({ r: 0, g: 0, b: 0 })),
  traceRay: vi.fn(() => ({ r: 0, g: 0, b: 0 })),
  raytracingSettings: {
    enableShadows: true,
    maxReflectionDepth: 3,
    enableRefraction: true
  }
}));

describe('Renderer Module', () => {
  let mockGpu;
  let mockScene;
  let mockCamera;
  
  beforeEach(() => {
    mockGpu = {
      device: {
        queue: {
          submit: vi.fn(),
          writeTexture: vi.fn()
        }
      },
      context: {
        getCurrentTexture: vi.fn(() => ({
          createView: vi.fn(() => ({}))
        })),
        canvas: {
          width: 100,
          height: 100
        }
      },
      presentationFormat: 'rgba8unorm'
    };
    
    // Create mock objects for scene and camera
    mockScene = { objects: [] };
    mockCamera = {
      generateRay: vi.fn(() => ({ origin: {}, direction: {} }))
    };
    
    // Mock the getScene and getCamera functions
    vi.spyOn(rendererModule, 'getScene').mockImplementation(() => mockScene);
    vi.spyOn(rendererModule, 'getCamera').mockImplementation(() => mockCamera);
    
    // Reset the mocks
    vi.clearAllMocks();
  });
  
  describe('renderPreview', () => {
    it('should return false when gpu is null', async () => {
      const result = await rendererModule.renderPreview(null);
      expect(result).toBe(false);
    });
    
    it('should return false when gpu has error', async () => {
      const result = await rendererModule.renderPreview({ error: 'Test error' });
      expect(result).toBe(false);
    });
    
    it('should successfully render a preview', async () => {
      const result = await rendererModule.renderPreview(mockGpu);
      
      expect(gpuModule.createCommandEncoder).toHaveBeenCalledWith(mockGpu.device);
      expect(mockGpu.context.getCurrentTexture).toHaveBeenCalled();
      expect(gpuModule.createClearPassDescriptor).toHaveBeenCalled();
      expect(mockGpu.device.queue.submit).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should use provided clear color', async () => {
      const clearColor = { r: 0.1, g: 0.2, b: 0.3, a: 1.0 };
      await rendererModule.renderPreview(mockGpu, { clearColor });
      
      // Verify clearColor was passed to createClearPassDescriptor
      expect(gpuModule.createClearPassDescriptor).toHaveBeenCalledWith(
        expect.anything(),
        clearColor
      );
    });
  });
  
  describe('renderRaytrace', () => {
    it('should return false when gpu is null', async () => {
      const result = await rendererModule.renderRaytrace(null);
      expect(result).toBe(false);
    });
    
    it('should return false when gpu has error', async () => {
      const result = await rendererModule.renderRaytrace({ error: 'Test error' });
      expect(result).toBe(false);
    });
    
    it('should perform raytracing and return true', async () => {
      // Mock GPU and canvas
      const gpu = {
        device: {
          queue: {
            writeTexture: vi.fn()
          }
        },
        context: {
          canvas: {
            width: 100,
            height: 100
          },
          getCurrentTexture: vi.fn(() => ({ /* mock texture */ }))
        }
      };
      
      // Set up spy
      const traceRaySpy = vi.spyOn(await import('../js/raytracer.js'), 'traceRay');
      
      // Run the function
      const result = await rendererModule.renderRaytrace(gpu);
      
      // Verify results
      expect(result).toBe(true);
      expect(traceRaySpy).toHaveBeenCalled();
      expect(gpu.device.queue.writeTexture).toHaveBeenCalled();
    });
  });
}); 