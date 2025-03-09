/**
 * main.js
 * Initializes the UI and sets up event listeners for the interactive WebGPU raytracer.
 * This file handles the basic scaffolding for the preview (rasterization) and raytrace modes.
 */
import { initializeGPU } from './js/gpu.js';
import { 
  renderPreview, 
  renderRaytrace, 
  getCamera, 
  getSceneManager, 
  getScene,
  initSceneAndCamera 
} from './js/renderer.js';
import { Vector3 } from './js/math.js';
import { Material, Light, raytracingSettings } from './js/raytracer.js';

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const previewButton = document.getElementById('previewButton');
  const raytraceButton = document.getElementById('raytraceButton');
  const canvas = document.getElementById('canvas');
  const statusElement = document.getElementById('status');
  
  // Initialize scene and camera
  initSceneAndCamera();
  
  // Create controls panel
  createControlsPanel();
  
  // Initialize key and mouse event handlers for camera control
  initCameraControls(canvas);
  
  // Store GPU context for reuse
  let gpuContext = null;

  // Update the status to show loading
  updateStatus('Initializing GPU and rendering preview...');
  
  // Automatically initialize GPU and render the preview when page loads
  try {
    // Initialize GPU
    gpuContext = await getGPUContext();
    if (gpuContext) {
      // Render the preview automatically
      await renderPreview(gpuContext);
      updateStatus('Preview loaded. Use controls to interact with the scene.');
    } else {
      updateStatus('Failed to initialize GPU. Please check if your browser supports WebGPU.');
    }
  } catch (error) {
    console.error('Auto-preview error:', error);
    updateStatus(`Error: ${error.message}`);
  }

  /**
   * Initializes the GPU if not already initialized.
   * @returns {Promise<Object>} - The GPU context information
   */
  async function getGPUContext() {
    if (!gpuContext) {
      gpuContext = await initializeGPU(canvas);
      
      if (gpuContext.error) {
        console.error(gpuContext.error);
        alert(`WebGPU initialization failed: ${gpuContext.error}`);
        return null;
      }
    }
    return gpuContext;
  }
  
  /**
   * Create controls panel for scene interaction
   */
  function createControlsPanel() {
    // Create control panel container
    const controlsPanel = document.createElement('div');
    controlsPanel.id = 'controlsPanel';
    controlsPanel.style.position = 'absolute';
    controlsPanel.style.top = '10px';
    controlsPanel.style.right = '10px';
    controlsPanel.style.width = '300px';
    controlsPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    controlsPanel.style.padding = '10px';
    controlsPanel.style.borderRadius = '5px';
    controlsPanel.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
    
    // Add panel title
    const title = document.createElement('h3');
    title.textContent = 'Scene Controls';
    title.style.marginTop = '0';
    controlsPanel.appendChild(title);
    
    // Add camera controls section
    const cameraSection = document.createElement('div');
    cameraSection.innerHTML = `
      <h4>Camera Controls</h4>
      <p>WASD: Move camera | Arrow keys: Rotate camera</p>
      <div>
        <button id="resetCameraButton">Reset Camera</button>
      </div>
    `;
    controlsPanel.appendChild(cameraSection);
    
    // Add scene controls section
    const sceneSection = document.createElement('div');
    sceneSection.innerHTML = `
      <h4>Scene Controls</h4>
      <div>
        <button id="addSphereButton">Add Sphere</button>
        <button id="clearSceneButton">Clear Scene</button>
        <button id="defaultSceneButton">Reset to Cornell Box</button>
      </div>
    `;
    controlsPanel.appendChild(sceneSection);
    
    // Add material editor section
    const materialSection = document.createElement('div');
    materialSection.innerHTML = `
      <h4>Material Editor</h4>
      <div>
        <p>Select object: 
          <select id="objectSelector">
            <option value="">Select an object</option>
            <option value="reflective">Reflective Sphere</option>
            <option value="glass">Glass Sphere</option>
            <option value="matte">Matte Sphere</option>
            <option value="floor">Floor</option>
          </select>
        </p>
        <div id="materialEditor" style="display: none;">
          <div style="margin-bottom: 5px;">
            <label for="diffuseSlider">Diffuse:</label>
            <input type="range" id="diffuseSlider" min="0" max="1" step="0.1" value="0.7" style="width: 100%;">
          </div>
          <div style="margin-bottom: 5px;">
            <label for="specularSlider">Specular:</label>
            <input type="range" id="specularSlider" min="0" max="1" step="0.1" value="0.3" style="width: 100%;">
          </div>
          <div style="margin-bottom: 5px;">
            <label for="reflectionSlider">Reflection:</label>
            <input type="range" id="reflectionSlider" min="0" max="1" step="0.1" value="0" style="width: 100%;">
          </div>
          <div style="margin-bottom: 5px;">
            <label for="transparencySlider">Transparency:</label>
            <input type="range" id="transparencySlider" min="0" max="1" step="0.1" value="0" style="width: 100%;">
          </div>
          <div style="margin-bottom: 5px;">
            <label for="refractiveSlider">Refractive Index:</label>
            <input type="range" id="refractiveSlider" min="1" max="2.5" step="0.1" value="1.5" style="width: 100%;">
          </div>
          <div style="margin-bottom: 5px;">
            <label for="materialColor">Color:</label>
            <input type="color" id="materialColor" value="#ffffff" style="width: 50px;">
          </div>
          <div>
            <label>
              <input type="checkbox" id="useTextureCheckbox"> Use Texture
            </label>
            <select id="textureSelector" style="margin-left: 10px; display: none;">
              <option value="checker">Checkerboard</option>
              <option value="gradient">Gradient</option>
              <option value="marble">Marble</option>
            </select>
          </div>
          <button id="applyMaterialButton" style="margin-top: 10px;">Apply Material</button>
        </div>
      </div>
    `;
    controlsPanel.appendChild(materialSection);
    
    // Add lighting controls section
    const lightingSection = document.createElement('div');
    lightingSection.innerHTML = `
      <h4>Lighting Controls</h4>
      <div style="margin-bottom: 10px;">
        <label for="lightIntensity">Main Light Intensity:</label>
        <input type="range" id="lightIntensity" min="0" max="2" step="0.1" value="1.0" style="width: 100%;">
      </div>
      <div style="margin-bottom: 10px;">
        <label for="lightColor">Main Light Color:</label>
        <input type="color" id="lightColor" value="#ffffff" style="width: 50px;">
      </div>
      <div style="margin-bottom: 10px;">
        <label for="secondaryIntensity">Secondary Light Intensity:</label>
        <input type="range" id="secondaryIntensity" min="0" max="1" step="0.1" value="0.5" style="width: 100%;">
      </div>
      <div>
        <button id="addLightButton">Add Light</button>
        <button id="toggleShadowsButton">Toggle Shadows</button>
      </div>
    `;
    controlsPanel.appendChild(lightingSection);

    // Add raytracing settings section
    const settingsSection = document.createElement('div');
    settingsSection.innerHTML = `
      <h4>Raytracing Settings</h4>
      <div style="margin-bottom: 10px;">
        <label for="maxReflectionDepth">Max Reflection Depth:</label>
        <input type="range" id="maxReflectionDepth" min="1" max="10" step="1" value="3" style="width: 100%;">
      </div>
      <div>
        <label>
          <input type="checkbox" id="enableRefractionCheckbox" checked> Enable Refraction
        </label>
      </div>
    `;
    controlsPanel.appendChild(settingsSection);
    
    // Add help section
    const helpSection = document.createElement('div');
    helpSection.innerHTML = `
      <h4>Help</h4>
      <p>1. Use controls to adjust the scene</p>
      <p>2. Click "Preview" for fast rasterization view</p>
      <p>3. Click "Render with Raytracer" for high-quality render</p>
    `;
    controlsPanel.appendChild(helpSection);
    
    // Add panel to the document
    document.body.appendChild(controlsPanel);
    
    // Add event listeners for the control buttons
    document.getElementById('resetCameraButton').addEventListener('click', resetCamera);
    document.getElementById('addSphereButton').addEventListener('click', addRandomSphere);
    document.getElementById('clearSceneButton').addEventListener('click', clearScene);
    document.getElementById('defaultSceneButton').addEventListener('click', resetToCornellBox);
    
    // Add event listeners for lighting controls
    document.getElementById('lightIntensity').addEventListener('input', updateMainLight);
    document.getElementById('lightColor').addEventListener('input', updateMainLight);
    document.getElementById('secondaryIntensity').addEventListener('input', updateSecondaryLight);
    document.getElementById('addLightButton').addEventListener('click', addRandomLight);
    document.getElementById('toggleShadowsButton').addEventListener('click', toggleShadows);
    
    // Add event listeners for material editor
    document.getElementById('objectSelector').addEventListener('change', selectObject);
    document.getElementById('applyMaterialButton').addEventListener('click', applyMaterial);
    document.getElementById('useTextureCheckbox').addEventListener('change', toggleTextureSelector);
    
    // Add event listeners for raytracing settings
    document.getElementById('maxReflectionDepth').addEventListener('input', updateRaytracingSettings);
    document.getElementById('enableRefractionCheckbox').addEventListener('change', updateRaytracingSettings);
  }
  
  /**
   * Initialize camera control event handlers
   * @param {HTMLElement} canvas - The canvas element for mouse controls
   */
  function initCameraControls(canvas) {
    // Key states
    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false
    };
    
    // Key down handler
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
        case 'arrowup': keys.arrowUp = true; break;
        case 'arrowdown': keys.arrowDown = true; break;
        case 'arrowleft': keys.arrowLeft = true; break;
        case 'arrowright': keys.arrowRight = true; break;
      }
    });
    
    // Key up handler
    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
        case 'arrowup': keys.arrowUp = false; break;
        case 'arrowdown': keys.arrowDown = false; break;
        case 'arrowleft': keys.arrowLeft = false; break;
        case 'arrowright': keys.arrowRight = false; break;
      }
    });
    
    // Mouse movement for first-person camera control
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    
    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    
    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        const camera = getCamera();
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        // Pan left/right
        if (deltaX !== 0) {
          camera.pan(-deltaX * 0.5);
        }
        
        // Tilt up/down
        if (deltaY !== 0) {
          camera.tilt(-deltaY * 0.5);
        }
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        // Update the preview
        updatePreview();
      }
    });
    
    // Set up animation loop for smooth camera movement
    function updateCamera() {
      const camera = getCamera();
      const moveSpeed = 0.1;
      const rotateSpeed = 2;
      let needsUpdate = false;
      
      // Handle movement
      if (keys.w) { camera.moveForward(moveSpeed); needsUpdate = true; }
      if (keys.s) { camera.moveForward(-moveSpeed); needsUpdate = true; }
      if (keys.a) { camera.moveRight(-moveSpeed); needsUpdate = true; }
      if (keys.d) { camera.moveRight(moveSpeed); needsUpdate = true; }
      
      // Handle rotation
      if (keys.arrowUp) { camera.tilt(rotateSpeed); needsUpdate = true; }
      if (keys.arrowDown) { camera.tilt(-rotateSpeed); needsUpdate = true; }
      if (keys.arrowLeft) { camera.pan(rotateSpeed); needsUpdate = true; }
      if (keys.arrowRight) { camera.pan(-rotateSpeed); needsUpdate = true; }
      
      // Update preview if camera changed
      if (needsUpdate) {
        updatePreview();
      }
      
      // Continue the animation loop
      requestAnimationFrame(updateCamera);
    }
    
    // Start the animation loop
    updateCamera();
  }
  
  /**
   * Update the preview rendering (used after camera/scene changes)
   */
  async function updatePreview() {
    const gpu = await getGPUContext();
    if (gpu) {
      await renderPreview(gpu);
    }
  }
  
  /**
   * Reset the camera to its default position
   */
  function resetCamera() {
    const camera = getCamera();
    camera.position = new Vector3(0, 0, -3);
    camera.direction = normalize(new Vector3(0, 0, 1));
    camera.right = new Vector3(1, 0, 0);
    camera.up = new Vector3(0, 1, 0);
    updatePreview();
    updateStatus('Camera reset to default position');
  }
  
  /**
   * Add a random sphere to the scene
   */
  function addRandomSphere() {
    const sceneManager = getSceneManager();
    
    // Generate random position, size, and color
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 3 - 1;
    const z = Math.random() * 3 + 3;
    const radius = Math.random() * 0.5 + 0.2;
    
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    
    const position = new Vector3(x, y, z);
    const material = new Material({ r, g, b });
    
    // Add sphere to scene
    const id = sceneManager.addObject({
      center: position,
      radius: radius,
      material: material,
      type: 'sphere'
    });
    
    updatePreview();
    updateStatus(`Added sphere at position (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
  }
  
  /**
   * Clear all objects from the scene
   */
  function clearScene() {
    const sceneManager = getSceneManager();
    sceneManager.clearScene();
    updatePreview();
    updateStatus('Scene cleared');
  }
  
  /**
   * Reset to the Cornell box scene
   */
  function resetToCornellBox() {
    const sceneManager = getSceneManager();
    sceneManager.createCornellBox();
    updatePreview();
    updateStatus('Reset to Cornell box scene');
  }
  
  /**
   * Update the status text
   * @param {string} message - Status message to display
   */
  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = `Status: ${message}`;
    }
  }
  
  /**
   * Normalize a vector
   * @param {Vector3} v - Vector to normalize
   * @returns {Vector3} Normalized vector
   */
  function normalize(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) {
      return new Vector3(0, 0, 0);
    }
    return new Vector3(v.x / length, v.y / length, v.z / length);
  }

  previewButton.addEventListener('click', async () => {
    previewButton.disabled = true;
    updateStatus('Rendering preview...');
    try {
      const gpu = await getGPUContext();
      if (gpu) {
        await renderPreview(gpu);
        updateStatus('Preview render completed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      updateStatus(`Error: ${error.message}`);
    } finally {
      previewButton.disabled = false;
    }
  });

  raytraceButton.addEventListener('click', async () => {
    raytraceButton.disabled = true;
    updateStatus('Starting raytracing...');
    try {
      const gpu = await getGPUContext();
      if (gpu) {
        await renderRaytrace(gpu);
      }
    } catch (error) {
      console.error('Raytracing error:', error);
      updateStatus(`Error: ${error.message}`);
    } finally {
      raytraceButton.disabled = false;
    }
  });

  /**
   * Update the main light in the scene based on UI controls
   */
  function updateMainLight() {
    const sceneManager = getSceneManager();
    const scene = getScene();
    
    // Find the main light (first light in the scene)
    if (scene.lights && scene.lights.length > 0) {
      const mainLight = scene.lights[0];
      const intensityValue = parseFloat(document.getElementById('lightIntensity').value);
      const colorValue = document.getElementById('lightColor').value;
      
      // Convert hex color to RGB (0-1 range)
      const r = parseInt(colorValue.substr(1, 2), 16) / 255;
      const g = parseInt(colorValue.substr(3, 2), 16) / 255;
      const b = parseInt(colorValue.substr(5, 2), 16) / 255;
      
      mainLight.intensity = intensityValue;
      mainLight.color = { r, g, b };
      
      updatePreview();
      updateStatus(`Main light updated (intensity: ${intensityValue.toFixed(1)})`);
    } else {
      updateStatus('No lights found in scene');
    }
  }

  /**
   * Update the secondary light in the scene based on UI controls
   */
  function updateSecondaryLight() {
    const sceneManager = getSceneManager();
    const scene = getScene();
    
    // Find the secondary light (second light in the scene)
    if (scene.lights && scene.lights.length > 1) {
      const secondaryLight = scene.lights[1];
      const intensityValue = parseFloat(document.getElementById('secondaryIntensity').value);
      
      secondaryLight.intensity = intensityValue;
      
      updatePreview();
      updateStatus(`Secondary light updated (intensity: ${intensityValue.toFixed(1)})`);
    } else {
      updateStatus('No secondary light found in scene');
    }
  }

  /**
   * Add a random light to the scene
   */
  function addRandomLight() {
    const sceneManager = getSceneManager();
    const scene = getScene();
    
    // Generate random position and color
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 3 - 1;
    const z = Math.random() * 3 + 3;
    
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    
    const position = new Vector3(x, y, z);
    const color = { r, g, b };
    const intensity = Math.random() * 0.5 + 0.5;
    
    // Add a new point light
    scene.addLight(new Light('point', {
      position,
      color,
      intensity
    }));
    
    updatePreview();
    updateStatus(`Added light at position (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
  }

  /**
   * Toggle shadow rendering on/off
   */
  function toggleShadows() {
    raytracingSettings.enableShadows = !raytracingSettings.enableShadows;
    
    updateStatus(`Shadows ${raytracingSettings.enableShadows ? 'enabled' : 'disabled'}`);
    
    // Re-render the scene to show the change
    updatePreview();
  }

  /**
   * Update raytracing settings based on UI
   */
  function updateRaytracingSettings() {
    raytracingSettings.maxReflectionDepth = parseInt(document.getElementById('maxReflectionDepth').value);
    raytracingSettings.enableRefraction = document.getElementById('enableRefractionCheckbox').checked;
    
    updateStatus(`Updated raytracing settings (Reflection Depth: ${raytracingSettings.maxReflectionDepth}, Refraction: ${raytracingSettings.enableRefraction ? 'On' : 'Off'})`);
  }

  /**
   * Toggle the texture selector visibility based on checkbox
   */
  function toggleTextureSelector() {
    const useTexture = document.getElementById('useTextureCheckbox').checked;
    document.getElementById('textureSelector').style.display = useTexture ? 'inline-block' : 'none';
  }

  /**
   * Select an object to edit its material
   */
  function selectObject() {
    const objectId = document.getElementById('objectSelector').value;
    
    if (!objectId) {
      document.getElementById('materialEditor').style.display = 'none';
      return;
    }
    
    document.getElementById('materialEditor').style.display = 'block';
    
    // Get the scene and materials
    const scene = getScene();
    
    // Populate the material editor with the selected object's properties
    let material;
    
    // Based on the selected object ID, find the appropriate sphere in the scene
    // This is simplified for the demo - in a real app, you'd use actual object IDs
    switch(objectId) {
      case 'reflective':
        // Assuming the first sphere is the reflective one
        material = scene.objects.find(obj => obj instanceof Sphere && obj.radius === 1)?.material;
        break;
      case 'glass':
        // Assuming the glass sphere is the one with transparency > 0
        material = scene.objects.find(obj => obj instanceof Sphere && obj.material.transparency > 0)?.material;
        break;
      case 'matte':
        // Assuming the matte sphere is the smaller one
        material = scene.objects.find(obj => obj instanceof Sphere && obj.radius === 0.3)?.material;
        break;
      case 'floor':
        // Assuming the floor is the first plane
        material = scene.objects.find(obj => obj instanceof Plane)?.material;
        break;
    }
    
    if (material) {
      // Update UI with material properties
      document.getElementById('diffuseSlider').value = material.diffuse;
      document.getElementById('specularSlider').value = material.specular;
      document.getElementById('reflectionSlider').value = material.reflection;
      document.getElementById('transparencySlider').value = material.transparency;
      document.getElementById('refractiveSlider').value = material.refractiveIndex;
      
      // Convert RGB to hex for the color input
      const color = material.color;
      const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
      const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
      const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
      document.getElementById('materialColor').value = `#${r}${g}${b}`;
      
      // Set texture checkbox
      const hasTexture = !!material.texture;
      document.getElementById('useTextureCheckbox').checked = hasTexture;
      document.getElementById('textureSelector').style.display = hasTexture ? 'inline-block' : 'none';
      
      updateStatus(`Selected object: ${objectId}`);
    }
  }

  /**
   * Apply the material changes to the selected object
   */
  function applyMaterial() {
    const objectId = document.getElementById('objectSelector').value;
    
    if (!objectId) {
      return;
    }
    
    // Get the scene and materials
    const scene = getScene();
    
    // Find the selected object
    let selectedObject;
    
    switch(objectId) {
      case 'reflective':
        selectedObject = scene.objects.find(obj => obj instanceof Sphere && obj.radius === 1);
        break;
      case 'glass':
        selectedObject = scene.objects.find(obj => obj instanceof Sphere && obj.material.transparency > 0);
        break;
      case 'matte':
        selectedObject = scene.objects.find(obj => obj instanceof Sphere && obj.radius === 0.3);
        break;
      case 'floor':
        selectedObject = scene.objects.find(obj => obj instanceof Plane);
        break;
    }
    
    if (selectedObject) {
      // Get material values from UI
      const diffuse = parseFloat(document.getElementById('diffuseSlider').value);
      const specular = parseFloat(document.getElementById('specularSlider').value);
      const reflection = parseFloat(document.getElementById('reflectionSlider').value);
      const transparency = parseFloat(document.getElementById('transparencySlider').value);
      const refractiveIndex = parseFloat(document.getElementById('refractiveSlider').value);
      
      // Get color from UI
      const colorHex = document.getElementById('materialColor').value;
      const r = parseInt(colorHex.slice(1, 3), 16) / 255;
      const g = parseInt(colorHex.slice(3, 5), 16) / 255;
      const b = parseInt(colorHex.slice(5, 7), 16) / 255;
      
      // Create new material
      const material = selectedObject.material;
      material.color = { r, g, b };
      material.diffuse = diffuse;
      material.specular = specular;
      material.reflection = reflection;
      material.transparency = transparency;
      material.refractiveIndex = refractiveIndex;
      
      // Handle texture
      const useTexture = document.getElementById('useTextureCheckbox').checked;
      if (useTexture) {
        const textureType = document.getElementById('textureSelector').value;
        
        // Create the selected texture
        switch(textureType) {
          case 'checker':
            // Import dynamically to keep this clean
            import('./js/textures.js').then(({ CheckerboardTexture }) => {
              material.texture = new CheckerboardTexture(
                { r, g, b }, // Main color from input
                { r: 1-r, g: 1-g, b: 1-b }, // Complementary color
                5
              );
              updatePreview();
            });
            break;
          case 'gradient':
            import('./js/textures.js').then(({ GradientTexture }) => {
              material.texture = new GradientTexture(
                { r, g, b }, // Main color from input
                { r: r*0.5, g: g*0.5, b: b*0.5 }, // Darker version
                'vertical'
              );
              updatePreview();
            });
            break;
          case 'marble':
            import('./js/textures.js').then(({ MarbleTexture }) => {
              material.texture = new MarbleTexture(
                { r, g, b }, // Main color from input
                { r: 1-r, g: 1-g, b: 1-b }, // Complementary color
                10, 5
              );
              updatePreview();
            });
            break;
        }
      } else {
        material.texture = null;
      }
      
      updatePreview();
      updateStatus(`Applied material changes to ${objectId}`);
    }
  }
}); 