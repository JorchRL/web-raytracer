/**
 * GPU module for handling WebGPU initialization and context management.
 * Provides functionality to set up a WebGPU device, context, and adapter.
 */

/**
 * Initializes WebGPU by requesting a GPU adapter, device, and configuring the canvas context.
 * @param {HTMLCanvasElement} canvas - The canvas element to render to.
 * @returns {Promise<{device: GPUDevice, context: GPUCanvasContext, presentationFormat: GPUTextureFormat} | {error: string}>}
 * Returns either the GPU objects or an error object if initialization fails.
 */
export async function initializeGPU(canvas) {
  try {
    if (!navigator.gpu) {
      return { error: 'WebGPU is not supported in this browser.' };
    }
    
    // Request adapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { error: 'Failed to get GPU adapter.' };
    }
    
    // Request device with explicit feature requirements
    const device = await adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {}
    });
    
    // Set up device lost handler
    device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`);
      console.error(`Reason: ${info.reason}`);
      // In a real app, you would implement recovery here
    });
    
    // Configure the canvas context
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    
    // IMPORTANT: Include usage flags to allow both rendering and texture copying
    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST
    });
    
    console.log('GPU initialized successfully with RENDER_ATTACHMENT and COPY_DST usage flags');
    return { device, context, presentationFormat };
  } catch (err) {
    console.error('GPU initialization error:', err);
    return { error: `GPU initialization failed: ${err.message}` };
  }
}

/**
 * Creates a command encoder and returns it
 * @param {GPUDevice} device - The WebGPU device
 * @returns {GPUCommandEncoder} Command encoder
 */
export function createCommandEncoder(device) {
  return device.createCommandEncoder();
}

/**
 * Creates a render pass descriptor for clearing the screen
 * @param {GPUTextureView} textureView - View of the target texture
 * @param {Object} clearColor - RGBA clear color
 * @returns {Object} Render pass descriptor
 */
export function createClearPassDescriptor(textureView, clearColor = { r: 0, g: 0, b: 0, a: 1 }) {
  return {
    colorAttachments: [{
      view: textureView,
      clearValue: clearColor,
      loadOp: 'clear',
      storeOp: 'store'
    }]
  };
} 