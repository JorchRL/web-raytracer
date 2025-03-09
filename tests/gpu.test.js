/**
 * GPU module tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeGPU, createCommandEncoder, createClearPassDescriptor } from '../js/gpu.js';

// Mock WebGPU API since it's not available in the test environment
describe('GPU Module', () => {
  // Mock elements and browser APIs
  let mockCanvas;
  let mockDevice;
  let mockContext;
  let mockAdapter;
  
  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      getContext: vi.fn(() => mockContext)
    };
    
    // Create mock WebGPU context
    mockContext = {
      configure: vi.fn()
    };
    
    // Create mock WebGPU device
    mockDevice = {
      createCommandEncoder: vi.fn(() => ({ finish: () => ({}) })),
      queue: {
        submit: vi.fn()
      },
      lost: Promise.resolve({ message: 'Test device loss', reason: 'test' })
    };
    
    // Create mock WebGPU adapter
    mockAdapter = {
      requestDevice: vi.fn(() => Promise.resolve(mockDevice))
    };
    
    // Mock global navigator.gpu
    global.navigator = {
      gpu: {
        requestAdapter: vi.fn(() => Promise.resolve(mockAdapter)),
        getPreferredCanvasFormat: vi.fn(() => 'rgba8unorm')
      }
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('initializeGPU', () => {
    it('should return device, context, and presentationFormat when initialization succeeds', async () => {
      const result = await initializeGPU(mockCanvas);
      
      expect(global.navigator.gpu.requestAdapter).toHaveBeenCalled();
      expect(mockAdapter.requestDevice).toHaveBeenCalled();
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgpu');
      expect(mockContext.configure).toHaveBeenCalled();
      
      expect(result).toHaveProperty('device');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('presentationFormat');
      expect(result).not.toHaveProperty('error');
    });
    
    it('should return error object when WebGPU is not supported', async () => {
      // Remove GPU support
      global.navigator.gpu = undefined;
      
      const result = await initializeGPU(mockCanvas);
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('not supported');
    });
    
    it('should return error object when adapter request fails', async () => {
      // Make adapter request fail
      global.navigator.gpu.requestAdapter = vi.fn(() => Promise.resolve(null));
      
      const result = await initializeGPU(mockCanvas);
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to get GPU adapter');
    });
  });

  describe('createCommandEncoder', () => {
    it('should call device.createCommandEncoder', () => {
      createCommandEncoder(mockDevice);
      expect(mockDevice.createCommandEncoder).toHaveBeenCalled();
    });
  });

  describe('createClearPassDescriptor', () => {
    it('should create a valid render pass descriptor with default color', () => {
      const textureView = {};
      const result = createClearPassDescriptor(textureView);
      
      expect(result).toHaveProperty('colorAttachments');
      expect(result.colorAttachments[0]).toHaveProperty('view', textureView);
      expect(result.colorAttachments[0]).toHaveProperty('clearValue');
      expect(result.colorAttachments[0].loadOp).toBe('clear');
      expect(result.colorAttachments[0].storeOp).toBe('store');
    });
    
    it('should use provided clear color', () => {
      const textureView = {};
      const clearColor = { r: 0.5, g: 0.6, b: 0.7, a: 0.8 };
      const result = createClearPassDescriptor(textureView, clearColor);
      
      expect(result.colorAttachments[0].clearValue).toBe(clearColor);
    });
  });
}); 