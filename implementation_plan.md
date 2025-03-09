# Implementation Plan for WebGPU Interactive Raytracer

This document outlines the phases for implementing the interactive raytracer, including suggested LLM models and carefully crafted prompts for each phase. The goal is to keep each prompt concise to fit within a small context window while ensuring TDD practices and clear separation of concerns.

---

## Stage 1: Core Raytracer Implementation

### Phase 1: Project Scaffolding

**Objective:** Create the basic project structure: index.html, main.js, and .cursorrules.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 1 (o3-mini):**

```
Please create a simple project scaffold for a WebGPU interactive raytracer with the following files:
- index.html: This should include a minimal web UI with two buttons labeled "Preview (Rasterization)" and "Render with Raytracer", and a canvas element for rendering.
- main.js: This should set up the basic DOM event listeners tied to the buttons and stub functions for GPU initialization, preview rendering, and raytracing rendering. Each function should include JSDoc comments.
- .cursorrules: Include coding guidelines that enforce pure functions, separation of concerns, TDD practices, and modular design.

Ensure the code is self-contained and uses native WebGPU APIs. Provide clear, concise inline comments and use vitest for testing (even if tests are stubs at this point).
```

---

### Phase 2: GPU Initialization and Preview Pipeline

**Objective:** Implement real GPU initialization and a basic rasterization pipeline for preview mode.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 2 (claude-3.7-sonnet):**

```
Extend the existing initializeGPU() function in main.js to request a GPU adapter and device using native WebGPU APIs. Also, implement a basic preview rendering pipeline that uses rasterization. Include error handling and concise console logging to confirm GPU initialization. The code should remain modular, with clear separation of GPU initialization from rendering logic. Additionally, write vitest unit tests to verify that the GPU initialization returns a valid device.
```

---

### Phase 3: Basic Raytracing Engine

**Objective:** Develop the core raytracing engine with minimal ADTs and basic ray-scene intersection logic.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 3 (claude-3.7-sonnet):**

```
Develop a basic raytracing engine in JavaScript. Define abstract data types (ADTs) for Ray, Intersection, Material, and Geometry. Implement the renderRaytrace() function in main.js to perform basic raytracing on a scene with simple geometries (e.g., a sphere and a plane). Ensure all functions are documented using JSDoc comments, and structure the code to allow for future extensions. Write comprehensive vitest tests to verify ray-scene intersections and basic shading computations.
```

---

### Phase 4: Scene and Camera Management

**Objective:** Implement interactive scene and camera control to update the rendering based on user input.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 4 (o3-mini):**

```
Implement scene and camera management functions in JavaScript. Create updateScene() and updateCamera() functions that modify scene geometries and camera parameters based on user interactions. Validate inputs and ensure modular design and clear separation from GPU operations. Add JSDoc comments to describe the functions. Also, write vitest tests to verify that state updates are performed accurately.
```

---

### Phase 5: Testing Integration and Feedback Loop

**Objective:** Create a streamlined test suite using vitest that outputs only critical failure summaries, supporting a rapid feedback cycle.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 5 (o3-mini):**

```
Update the package.json to include a test script (e.g., "test:condensed") that runs vitest in a mode which displays only critical failure summaries. Ensure that tests for GPU initialization, preview rendering, the raytracing engine, and scene/camera management are incorporated. Provide a minimal vitest configuration if necessary, and ensure that test outputs are concise to facilitate rapid iterative feedback.
```

---

### Phase 6: Review and Iterative Improvement

**Objective:** Summarize test results and facilitate a quick feedback loop for iterative development.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 6 (claude-3.7-sonnet):**

```
Provide a concise summary of the vitest test results for the WebGPU interactive raytracer project. The report should list only failing tests along with brief bug summaries and suggested fixes. This summary will be used to drive iterative improvements in the codebase. Ensure the output is plain text and focused on critical issues only.
```

---

## Stage 2: Enhanced Features and Optimization

### Phase 7: Auto-loading Preview with Cornell Box

**Objective:** Modify the application to automatically display a preview of a Cornell box scene when the app loads.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 7 (o3-mini):**

```
Enhance the WebGPU raytracer to automatically display a preview when the application loads. Implement a createCornellBox() function in the SceneManager that generates a standard Cornell box scene (a box with colored walls and simple objects inside). Modify the initialization flow to create and display this scene on startup without requiring user interaction. Update the camera position to provide a good view of the Cornell box. Ensure the preview is displayed as soon as possible after the page loads.
```

---

### Phase 8: Basic Lighting and Shadows

**Objective:** Implement basic lighting and shadows to make the scene more realistic.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 8 (claude-3.7-sonnet):**

```
Implement basic lighting and shadows for the WebGPU raytracer. Add a Light class that supports point lights and directional lights. Enhance the raytracePixel function to calculate diffuse lighting based on surface normals and light directions. Implement shadow rays to determine if points are in shadow. Update the Material class to include properties like diffuse and specular coefficients. Add UI controls for adjusting light properties such as position, color, and intensity. Write comprehensive tests verifying the lighting calculations and shadow determination.
```

---

### Phase 9: Material Enhancements

**Objective:** Add support for more realistic materials with reflection, transparency, and texture mapping.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 9 (claude-3.7-sonnet):**

```
Enhance the Material system in the WebGPU raytracer to support more realistic surface properties. Update the Material class to include reflection, refraction, and transparency coefficients. Implement recursive raytracing in the raytracePixel function to handle reflective and transparent surfaces. Add support for basic texture mapping with UV coordinates. Create a material editor UI component that allows users to adjust material properties interactively. Implement the Fresnel effect for realistic reflection/refraction transitions. Ensure that recursive raytracing has a maximum depth to prevent infinite recursion. Write tests to verify the correct behavior of reflections and refractions.
```

---

### Phase 10: Performance Optimization with Spatial Data Structures

**Objective:** Improve raytracing performance by implementing spatial data structures.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 10 (claude-3.7-sonnet):**

```
Implement a bounding volume hierarchy (BVH) to optimize raytracing performance. Add an AABB (Axis-Aligned Bounding Box) class for encapsulating geometry. Create a BVH class with build and traversal functions. Update all geometry classes to provide bounding boxes. Modify the ray-scene intersection code to traverse the BVH instead of testing all objects. Implement a visualization option to show the BVH structure. Add performance metrics to measure and display the speedup compared to brute-force intersection testing. Write tests verifying the BVH construction and traversal correctness. Ensure that the BVH automatically rebuilds when scene objects change.
```

---

### Phase 11: WebGPU Compute Shader Raytracing

**Objective:** Move raytracing computations to the GPU using WebGPU compute shaders.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 11 (claude-3.7-sonnet):**

```
Implement GPU-accelerated raytracing using WebGPU compute shaders. Create WGSL compute shaders for ray generation, intersection, and shading calculations. Design GPU buffer layouts for scene data (geometries, materials, lights, BVH). Implement a compute pipeline that dispatches work across the image pixels. Create functions to transfer scene data to GPU buffers and read back the rendered image. Include progressive rendering capability for real-time feedback. Add fallback to CPU rendering when WebGPU compute is not available. Write tests comparing the output of GPU and CPU rendering to ensure consistency. Measure and display performance metrics comparing GPU vs CPU rendering.
```

---

### Phase 12: Advanced Camera Models

**Objective:** Implement more realistic camera models with depth of field, motion blur, and lens effects.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 12 (o3-mini):**

```
Enhance the Camera class to support realistic camera effects. Add properties for aperture size, focal length, and focus distance. Implement depth of field by generating multiple rays with slight variations around the aperture for each pixel. Add motion blur support by taking into account the time dimension for moving objects. Create lens distortion effects such as barrel and pincushion distortion. Update the UI to include camera settings controls. Implement a real-time depth of field preview mode. Write tests verifying that the camera correctly generates ray distributions for depth of field and other effects.
```

---

### Phase 13: Advanced Rendering Techniques

**Objective:** Implement global illumination and other advanced rendering techniques.

**Recommended LLM:** claude-3.7-sonnet

**LLM Prompt for Phase 13 (claude-3.7-sonnet):**

```
Implement advanced rendering techniques to enhance the visual quality of the raytracer. Add support for path tracing to achieve global illumination with soft shadows and color bleeding. Implement ambient occlusion for improved realism in shadowed areas. Add environment mapping for realistic reflections of surroundings. Implement physically-based rendering (PBR) materials with metalness and roughness parameters. Add support for HDR rendering with tone mapping. Implement anti-aliasing through multisampling or adaptive sampling. Create quality settings that allow users to balance visual quality with performance. Write tests verifying the correctness of each rendering technique.
```

---

### Phase 14: User Interface Enhancements

**Objective:** Improve the user interface for easier scene creation and management.

**Recommended LLM:** o3-mini

**LLM Prompt for Phase 14 (o3-mini):**

```
Enhance the user interface to improve scene editing capabilities. Implement a hierarchical scene graph view that shows the structure of the scene. Add transform gizmos for visual manipulation of objects in 3D space. Create a properties panel that dynamically shows and allows editing of the selected object's properties. Implement drag-and-drop object placement and scene composition. Add support for scene saving and loading using JSON format. Implement a simple animation system with keyframes. Add preset materials and objects that users can quickly add to scenes. Create a responsive design that works well on different devices and screen sizes. Write tests for UI component functionality.
```

---

This implementation plan is designed to guide the team of AI engineers step-by-step while ensuring each phase includes clear, test-driven development (TDD) practices and modular, maintainable code. The chosen LLMs are selected based on their strengths in handling either straightforward scaffolding tasks (o3-mini) or more complex logic and detailed documentation (claude-3.7-sonnet).

## Dependencies and Suggested Order

The phases should generally be implemented in the order listed, with these considerations:

1. **Phase 7** (Auto-loading Preview) can be implemented immediately after completing Stage 1
2. **Phase 10** (Performance Optimization) should be implemented before other complex features to maintain good performance
3. **Phase 11** (WebGPU Compute Shaders) requires understanding of the CPU implementation first
4. **Phase 12, 13, and 14** can be implemented somewhat independently after the core features are in place

Each phase builds upon previous phases, and test-driven development should be practiced throughout by writing tests before implementing features. 