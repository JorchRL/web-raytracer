/**
 * Renderer module for handling preview (rasterization) and raytracing rendering.
 */
import { createCommandEncoder, createClearPassDescriptor } from './gpu.js';
import { 
  Scene, 
  Ray, 
  Vector3, 
  raytracePixel,
  Sphere,
  Plane,
  Material,
  Light,
  computeRayIntersection,
  calculateLighting,
  traceRay,
  raytracingSettings
} from './raytracer.js';
import { Camera } from './camera.js';
import { SceneManager } from './scene-manager.js';

// Global scene and camera objects
let scene = null;
let sceneManager = null;
let camera = null;

/**
 * Initialize the scene and camera
 * @returns {Object} The scene and camera objects
 */
export function initSceneAndCamera() {
  // Create the scene
  scene = new Scene();
  sceneManager = new SceneManager(scene);
  
  // Create a Cornell box scene instead of the default scene
  sceneManager.createCornellBox();
  
  // Create the camera with a position suitable for viewing the Cornell box
  // Position it to view the Cornell box from a good angle
  camera = new Camera({
    position: new Vector3(0, 0, -10), // Position further back to see more of the Cornell box
    lookAt: new Vector3(0, 0, 5),    // Look toward the center of the box 
    up: new Vector3(0, 1, 0),        // Up direction
    fov: 60,                         // Wide enough field of view to see most of the box
    aspectRatio: 16 / 9
  });
  
  console.log('DEBUG: initSceneAndCamera - Scene created with', scene.objects.length, 'objects and', scene.lights.length, 'lights');
  console.log('DEBUG: initSceneAndCamera - Camera initialized at position', camera.position, 'looking at', new Vector3(0, 0, 5));
  
  // Debug dump of scene objects
  if (scene && scene.objects) {
    console.log('DEBUG: Scene objects:');
    scene.objects.forEach((obj, index) => {
      if (obj.constructor.name === 'Sphere') {
        console.log(`  [${index}] Sphere at (${obj.center.x}, ${obj.center.y}, ${obj.center.z}) with radius ${obj.radius}`);
      } else if (obj.constructor.name === 'Plane') {
        console.log(`  [${index}] Plane at (${obj.point.x}, ${obj.point.y}, ${obj.point.z}) with normal (${obj.normal.x}, ${obj.normal.y}, ${obj.normal.z})`);
      }
    });
  }
  
  // Debug dump of lights
  if (scene && scene.lights) {
    console.log('DEBUG: Scene lights:');
    scene.lights.forEach((light, index) => {
      if (light.type === 'point') {
        console.log(`  [${index}] Point light at (${light.position.x}, ${light.position.y}, ${light.position.z})`);
      } else if (light.type === 'directional') {
        console.log(`  [${index}] Directional light with direction (${light.direction.x}, ${light.direction.y}, ${light.direction.z})`);
      }
    });
  }
  
  return { scene, camera, sceneManager };
}

/**
 * Get the current scene
 * @returns {Scene} The current scene
 */
export function getScene() {
  if (!scene) {
    initSceneAndCamera();
  }
  return scene;
}

/**
 * Get the current camera
 * @returns {Camera} The current camera
 */
export function getCamera() {
  if (!camera) {
    initSceneAndCamera();
  }
  return camera;
}

/**
 * Get the scene manager
 * @returns {SceneManager} The scene manager
 */
export function getSceneManager() {
  if (!sceneManager) {
    initSceneAndCamera();
  }
  return sceneManager;
}

/**
 * Renders a preview of the scene using a fast rasterization pipeline.
 * Clears the canvas with a sample color.
 * @param {{device: GPUDevice, context: GPUCanvasContext, presentationFormat: GPUTextureFormat}} gpu - GPU context
 * @param {Object} options - Rendering options
 * @param {Object} options.clearColor - RGBA clear color
 * @returns {Promise<boolean>} - Whether the render was successful
 */
export async function renderPreview(gpu, options = {}) {
  if (!gpu || gpu.error) {
    console.error('GPU not initialized properly:', gpu?.error || 'No GPU context');
    return false;
  }
  
  try {
    const { device, context } = gpu;
    const clearColor = options.clearColor || { r: 0.5, g: 0.5, b: 0.8, a: 1.0 };
    
    console.log('DEBUG: renderPreview - Starting preview render with clearColor:', clearColor);
    console.log('DEBUG: renderPreview - Canvas size:', context.canvas.width, 'x', context.canvas.height);
    console.log('DEBUG: renderPreview - Device features:', device.features);
    
    // Create command encoder and begin render pass
    const commandEncoder = createCommandEncoder(device);
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor = createClearPassDescriptor(textureView, clearColor);
    
    console.log('DEBUG: renderPreview - Created render pass with descriptor:', renderPassDescriptor);
    
    // Execute render pass 
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
    // In a real implementation, we would render scene geometry here using WebGPU drawing commands
    // For now, we're just clearing the screen as a placeholder
    // TODO: Implement actual scene rendering with proper geometry
    
    // End the render pass
    passEncoder.end();
    
    // Submit command buffer
    const commandBuffer = commandEncoder.finish();
    console.log('DEBUG: renderPreview - Finished command buffer, submitting to queue');
    device.queue.submit([commandBuffer]);
    console.log('Preview render completed');
    
    // Draw a simple representation of the scene using 2D canvas for debugging
    drawDebugSceneRepresentation(context.canvas);
    
    return true;
  } catch (err) {
    console.error('Preview rendering error:', err);
    return false;
  }
}

/**
 * Draws a simple representation of the scene using 2D canvas API for debugging
 * This is a temporary function to help visualize the scene while WebGPU implementation is in progress
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
function drawDebugSceneRepresentation(canvas) {
  try {
    // Create or get the debug overlay canvas
    let debugCanvas = document.getElementById('debugCanvas');
    if (!debugCanvas) {
      // Create a new canvas for debug rendering
      debugCanvas = document.createElement('canvas');
      debugCanvas.id = 'debugCanvas';
      debugCanvas.width = canvas.width;
      debugCanvas.height = canvas.height;
      debugCanvas.style.position = 'absolute';
      debugCanvas.style.top = canvas.offsetTop + 'px';
      debugCanvas.style.left = canvas.offsetLeft + 'px';
      debugCanvas.style.pointerEvents = 'none'; // Allow click-through
      debugCanvas.style.zIndex = '10';
      canvas.parentNode.appendChild(debugCanvas);
    }
    
    // Match the size of the main canvas if it changed
    if (debugCanvas.width !== canvas.width || debugCanvas.height !== canvas.height) {
      debugCanvas.width = canvas.width;
      debugCanvas.height = canvas.height;
    }
    
    // Get 2D context from the debug canvas
    const ctx = debugCanvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context for debug canvas');
      return;
    }
    
    // Clear previous drawings
    ctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    
    // Get the current scene and camera
    const currentScene = getScene();
    const currentCamera = getCamera();
    
    // Calculate a simple projection from 3D to 2D for visualization
    // This is just a placeholder and not physically accurate
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50; // Scale factor for visualization
    
    // No background for better visibility of WebGPU clear color
    
    // Helper function to project a 3D point to 2D canvas coordinates
    function projectPoint(point3D) {
      // Simple perspective projection
      const camToPoint = {
        x: point3D.x - currentCamera.position.x,
        y: point3D.y - currentCamera.position.y,
        z: point3D.z - currentCamera.position.z
      };
      
      // Don't render points behind the camera
      if (camToPoint.z <= 0) return null;
      
      // Simple perspective division
      const factor = 5 / camToPoint.z;
      return {
        x: centerX + camToPoint.x * scale * factor,
        y: centerY - camToPoint.y * scale * factor  // Flip Y for canvas
      };
    }
    
    // For the Cornell box, add borders to make it more visible
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("Cornell Box Preview (Debug Overlay)", 10, 60);
    
    // Draw a semi-transparent overlay box to make shapes stand out better
    const boxCornersWorld = [
      { x: -2.5, y: -2.5, z: 0 },    // Near bottom left
      { x: 2.5, y: -2.5, z: 0 },     // Near bottom right
      { x: 2.5, y: 2.5, z: 0 },      // Near top right
      { x: -2.5, y: 2.5, z: 0 },     // Near top left
      { x: -2.5, y: -2.5, z: 10 },   // Far bottom left
      { x: 2.5, y: -2.5, z: 10 },    // Far bottom right
      { x: 2.5, y: 2.5, z: 10 },     // Far top right
      { x: -2.5, y: 2.5, z: 10 }     // Far top left
    ];
    
    const boxCorners2D = boxCornersWorld.map(c => projectPoint(c)).filter(c => c !== null);
    
    // Draw box lines more prominently
    if (boxCorners2D.length === 8) {
      // Draw the front face
      ctx.beginPath();
      ctx.moveTo(boxCorners2D[0].x, boxCorners2D[0].y);
      ctx.lineTo(boxCorners2D[1].x, boxCorners2D[1].y);
      ctx.lineTo(boxCorners2D[2].x, boxCorners2D[2].y);
      ctx.lineTo(boxCorners2D[3].x, boxCorners2D[3].y);
      ctx.closePath();
      ctx.stroke();
      
      // Draw the back face
      ctx.beginPath();
      ctx.moveTo(boxCorners2D[4].x, boxCorners2D[4].y);
      ctx.lineTo(boxCorners2D[5].x, boxCorners2D[5].y);
      ctx.lineTo(boxCorners2D[6].x, boxCorners2D[6].y);
      ctx.lineTo(boxCorners2D[7].x, boxCorners2D[7].y);
      ctx.closePath();
      ctx.stroke();
      
      // Connect front to back
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(boxCorners2D[i].x, boxCorners2D[i].y);
        ctx.lineTo(boxCorners2D[i + 4].x, boxCorners2D[i + 4].y);
        ctx.stroke();
      }
    }
    
    // Draw the scene objects
    if (currentScene && currentScene.objects) {
      currentScene.objects.forEach(obj => {
        if (obj.constructor.name === 'Sphere') {
          // Draw a sphere
          const center2D = projectPoint(obj.center);
          if (center2D) {
            // Calculate projected radius based on distance
            const dist = Math.sqrt(
              Math.pow(obj.center.x - currentCamera.position.x, 2) + 
              Math.pow(obj.center.y - currentCamera.position.y, 2) + 
              Math.pow(obj.center.z - currentCamera.position.z, 2)
            );
            const projectedRadius = (obj.radius * scale) / (dist / 5);
            
            // Draw the sphere
            ctx.beginPath();
            ctx.arc(center2D.x, center2D.y, projectedRadius, 0, Math.PI * 2);
            
            // Use the material color
            const color = obj.material.color;
            ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.7)`;
            ctx.fill();
            
            // Add a stroke for clarity
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else if (obj.constructor.name === 'Plane') {
          // For planes, draw a simple grid to represent them
          // This is highly simplified and not accurate for all plane orientations
          const normal = obj.normal;
          const point = obj.point;
          
          // Only draw planes that are roughly visible to the camera
          // Skip planes facing away or edge-on
          const dotProduct = 
            normal.x * currentCamera.direction.x + 
            normal.y * currentCamera.direction.y + 
            normal.z * currentCamera.direction.z;
            
          if (Math.abs(dotProduct) < 0.3) return;  // Skip planes that are nearly edge-on
          
          // Use the material color
          const color = obj.material.color;
          ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`;
          ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.5)`;
          ctx.lineWidth = 1;
          
          // Draw many small quads to represent the plane
          // Simplified for now - just draw plane outline for major planes
          if (Math.abs(normal.y) > 0.9) {
            // Floor or ceiling
            const y = point.y;
            const size = 5; // Size of the plane
            const corners = [
              { x: -size, y: y, z: -size },
              { x: size, y: y, z: -size },
              { x: size, y: y, z: size + 10 },
              { x: -size, y: y, z: size + 10 }
            ];
            
            const corners2D = corners.map(c => projectPoint(c)).filter(c => c !== null);
            
            if (corners2D.length === 4) {
              ctx.beginPath();
              ctx.moveTo(corners2D[0].x, corners2D[0].y);
              for (let i = 1; i < corners2D.length; i++) {
                ctx.lineTo(corners2D[i].x, corners2D[i].y);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          } else if (Math.abs(normal.x) > 0.9) {
            // Left or right wall
            const x = point.x;
            const size = 5; // Size of the plane
            const corners = [
              { x: x, y: -size, z: -size },
              { x: x, y: size, z: -size },
              { x: x, y: size, z: size + 10 },
              { x: x, y: -size, z: size + 10 }
            ];
            
            const corners2D = corners.map(c => projectPoint(c)).filter(c => c !== null);
            
            if (corners2D.length === 4) {
              ctx.beginPath();
              ctx.moveTo(corners2D[0].x, corners2D[0].y);
              for (let i = 1; i < corners2D.length; i++) {
                ctx.lineTo(corners2D[i].x, corners2D[i].y);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          } else if (Math.abs(normal.z) > 0.9) {
            // Back wall
            const z = point.z;
            const size = 5; // Size of the plane
            const corners = [
              { x: -size, y: -size, z: z },
              { x: size, y: -size, z: z },
              { x: size, y: size, z: z },
              { x: -size, y: size, z: z }
            ];
            
            const corners2D = corners.map(c => projectPoint(c)).filter(c => c !== null);
            
            if (corners2D.length === 4) {
              ctx.beginPath();
              ctx.moveTo(corners2D[0].x, corners2D[0].y);
              for (let i = 1; i < corners2D.length; i++) {
                ctx.lineTo(corners2D[i].x, corners2D[i].y);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      });
    }
    
    // Draw lights
    if (currentScene && currentScene.lights) {
      currentScene.lights.forEach(light => {
        if (light.type === 'point' && light.position) {
          const light2D = projectPoint(light.position);
          if (light2D) {
            // Draw the light source
            ctx.beginPath();
            ctx.arc(light2D.x, light2D.y, 5, 0, Math.PI * 2);
            
            // Use the light color
            const color = light.color;
            ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.9)`;
            ctx.fill();
            
            // Add a stroke for clarity
            ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw a glow effect
            const gradient = ctx.createRadialGradient(
              light2D.x, light2D.y, 5,
              light2D.x, light2D.y, 15
            );
            gradient.addColorStop(0, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`);
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            ctx.beginPath();
            ctx.arc(light2D.x, light2D.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      });
    }
    
    // Draw camera position indicator and view direction
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(`Camera: (${currentCamera.position.x.toFixed(1)}, ${currentCamera.position.y.toFixed(1)}, ${currentCamera.position.z.toFixed(1)})`, 10, 20);
    ctx.fillText(`Looking: (${currentCamera.direction.x.toFixed(1)}, ${currentCamera.direction.y.toFixed(1)}, ${currentCamera.direction.z.toFixed(1)})`, 10, 40);
    
    console.log('DEBUG: Rendered debug scene representation');
  } catch (err) {
    console.error('Error drawing debug scene representation:', err);
  }
}

/**
 * Renders the final image using a raytracing pipeline.
 * @param {{device: GPUDevice, context: GPUCanvasContext, presentationFormat: GPUTextureFormat}} gpu - GPU context
 * @returns {Promise<boolean>} - Whether the render was successful
 */
export async function renderRaytrace(gpu) {
  if (!gpu || gpu.error) {
    console.error('GPU not initialized properly:', gpu?.error || 'No GPU context');
    return false;
  }

  try {
    const { device, context } = gpu;
    const canvas = context.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    console.log('DEBUG: renderRaytrace - Starting raytracing with canvas size:', width, 'x', height);
    
    // Get scene and camera (initialize if needed)
    const currentScene = getScene();
    const currentCamera = getCamera();
    
    console.log('DEBUG: renderRaytrace - Scene objects:', currentScene?.objects?.length || 0);
    console.log('DEBUG: renderRaytrace - Scene lights:', currentScene?.lights?.length || 0);
    console.log('DEBUG: renderRaytrace - Camera position:', currentCamera.position);
    console.log('DEBUG: renderRaytrace - Camera direction:', currentCamera.direction);
    
    // Let's first make sure the scene is properly set up
    if (!currentScene || !currentScene.objects || currentScene.objects.length === 0) {
      console.error('DEBUG: renderRaytrace - Scene is empty or not properly initialized');
      return false;
    }
    
    // Use a CPU-based raytracer for now
    console.log('Starting raytracing render...');
    const startTime = performance.now();
    
    // Create an image buffer
    const imageData = new Uint8ClampedArray(width * height * 4);
    
    // Background color - make it more visible for debugging
    const backgroundColor = { r: 0.1, g: 0.1, b: 0.2 };
    console.log('DEBUG: renderRaytrace - Using background color:', backgroundColor);
    
    // For debugging, we'll count the number of rays that hit something
    let hitCount = 0;
    let missCount = 0;
    
    // Render each pixel using camera rays
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Generate ray from camera through this pixel
        const ray = currentCamera.generateRay(x, y, width, height);
        
        // For debugging, check ray direction
        if (x === width/2 && y === height/2) {
          console.log('DEBUG: renderRaytrace - Center ray origin:', ray.origin);
          console.log('DEBUG: renderRaytrace - Center ray direction:', ray.direction);
        }
        
        // Use recursive ray tracing for advanced material support
        const color = traceRay(ray, currentScene, backgroundColor, 0);
        
        // Count hits vs misses for debugging (approximate check)
        if (
          Math.abs(color.r - backgroundColor.r) > 0.01 || 
          Math.abs(color.g - backgroundColor.g) > 0.01 || 
          Math.abs(color.b - backgroundColor.b) > 0.01
        ) {
          hitCount++;
        } else {
          missCount++;
        }
        
        // Convert to 0-255 range and set in image buffer
        const index = (y * width + x) * 4;
        imageData[index + 0] = Math.floor(color.r * 255); // R
        imageData[index + 1] = Math.floor(color.g * 255); // G
        imageData[index + 2] = Math.floor(color.b * 255); // B
        imageData[index + 3] = 255; // A
      }
      
      // Update progress every 10% of lines
      if (y % Math.floor(height / 10) === 0) {
        console.log(`Raytracing progress: ${Math.floor((y / height) * 100)}%`);
      }
    }
    
    console.log(`DEBUG: renderRaytrace - Ray hit statistics: ${hitCount} hits, ${missCount} misses (${((hitCount / (width * height)) * 100).toFixed(2)}% hit rate)`);
    
    // Copy the raytraced image to the GPU canvas
    const canvasTexture = context.getCurrentTexture();
    console.log('DEBUG: renderRaytrace - Writing texture data to GPU');
    
    try {
      device.queue.writeTexture(
        { texture: canvasTexture },
        imageData,
        { bytesPerRow: width * 4, rowsPerImage: height },
        { width, height }
      );
      console.log('DEBUG: renderRaytrace - Texture written successfully');
    } catch (err) {
      console.error('DEBUG: renderRaytrace - Error writing texture:', err);
      
      // Fallback to direct pixel manipulation using a 2D canvas overlay
      console.log('DEBUG: renderRaytrace - Attempting fallback rendering method...');
      
      try {
        // Create or get a fallback canvas
        let fallbackCanvas = document.getElementById('fallbackCanvas');
        if (!fallbackCanvas) {
          fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.id = 'fallbackCanvas';
          fallbackCanvas.width = width;
          fallbackCanvas.height = height;
          fallbackCanvas.style.position = 'absolute';
          fallbackCanvas.style.top = canvas.offsetTop + 'px';
          fallbackCanvas.style.left = canvas.offsetLeft + 'px';
          fallbackCanvas.style.zIndex = '5'; // Between WebGPU canvas and debug overlay
          canvas.parentNode.appendChild(fallbackCanvas);
        }
        
        // Make sure size matches
        fallbackCanvas.width = width;
        fallbackCanvas.height = height;
        
        // Get 2D context and draw
        const ctx = fallbackCanvas.getContext('2d');
        if (ctx) {
          // Create ImageData object from our pixel array
          const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
          ctx.putImageData(imgData, 0, 0);
          console.log('DEBUG: renderRaytrace - Fallback rendering applied successfully using 2D canvas');
        } else {
          console.error('DEBUG: renderRaytrace - Could not get 2D context for fallback canvas');
        }
      } catch (fallbackErr) {
        console.error('DEBUG: renderRaytrace - Fallback rendering failed:', fallbackErr);
      }
    }
    
    const endTime = performance.now();
    console.log(`Raytracing render completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    
    // Update the status element if it exists
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = `Status: Raytracing completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`;
    }
    
    return true;
  } catch (err) {
    console.error('Raytracing error:', err);
    return false;
  }
} 