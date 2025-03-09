# LLM Prompting Examples for WebGPU Interactive Raytracer

This document provides examples of effective prompts for AI engineers to implement features or fix issues in the WebGPU Interactive Raytracer project. These examples follow the implementation plan phases and can be used as templates for creating your own prompts.

## Prompt Structure

An effective prompt for an AI engineer typically follows this structure:

1. **Context**: Brief description of the project and the feature/fix being implemented
2. **Task**: Clear explanation of what needs to be done
3. **Requirements**: Specific requirements and acceptance criteria
4. **Code References**: Relevant files and code snippets
5. **Expected Outcome**: What the implementation should achieve
6. **Testing**: How the implementation should be tested

## Example Prompts

### Example 1: Implementing Basic Sphere Reflections (for claude-3.7-sonnet)

```
# Implement Basic Sphere Reflections in WebGPU Raytracer

## Context
You're working on a WebGPU-based raytracer that currently supports basic sphere and plane rendering. The current implementation already handles ray-sphere intersections and basic shading, but doesn't support reflections.

## Task
Extend the raytracer to support basic reflections for sphere objects. This will allow spheres to reflect light and show reflections of other objects in the scene.

## Requirements
1. Update the Material class to include a reflectivity property (0-1 value)
2. Modify the raytracePixel function to handle reflected rays
3. Implement a recursive approach with a maximum depth to prevent infinite reflections
4. Ensure good performance by limiting reflection depth to 3 levels

## Code References

The key files you'll need to modify are:

1. js/raytracer.js - Contains the core raytracing logic including the Material class and raytracePixel function
2. js/renderer.js - Contains the renderRaytrace function that uses raytracePixel

Here's the current Material class:
```javascript
export class Material {
  constructor(color) {
    this.color = color;
  }
}
```

Here's the relevant part of the raytracePixel function:
```javascript
export function raytracePixel(x, y, width, height, scene, backgroundColor) {
  // Convert pixel coordinates to normalized device coordinates (-1 to 1)
  const ndcX = (x / width) * 2 - 1;
  const ndcY = 1 - (y / height) * 2; // Flip Y axis
  
  // Create a ray from (0,0,0) pointing into the scene
  const origin = new Vector3(0, 0, 0);
  const direction = normalize(new Vector3(ndcX, ndcY, 1));
  const ray = new Ray(origin, direction);
  
  // Find the nearest intersection
  const intersection = computeRayIntersection(ray, scene);
  
  if (!intersection) {
    return backgroundColor;
  }
  
  // For now, just return the material color
  // In a more advanced raytracer, we would calculate lighting here
  return intersection.material.color;
}
```

## Expected Outcome
After implementation, spheres with reflective materials should show reflections of other objects in the scene. A sphere with reflectivity=1.0 should act like a perfect mirror, while reflectivity=0.0 should behave like the current implementation.

## Testing
1. Add tests for the updated Material class to verify reflectivity property
2. Add tests for reflection calculations with different reflectivity values
3. Make sure the raytracePixel function correctly handles the maximum reflection depth
4. Verify that a scene with multiple reflective objects renders correctly

When implementing this feature, follow the TDD approach described in the feedback loop guide. Start by updating the tests, then implement the functionality to make those tests pass.
```

### Example 2: Fixing Camera Movement Bug (for o3-mini)

```
# Fix Camera Movement Bug in WebGPU Raytracer

## Context
Users are reporting a bug where camera movement becomes unpredictable after rotating the camera. The issue appears to be related to how the camera's local coordinate system is updated after rotation.

## Task
Fix the camera movement bug by ensuring that camera movements are always relative to the current view direction, regardless of rotation.

## Requirements
1. Identify and fix the issue in the Camera class's movement methods
2. Ensure camera's right, up, and direction vectors remain orthogonal
3. Movements should always be relative to the camera's current orientation

## Code References

The issue is in the js/camera.js file, specifically in these methods:

```javascript
moveForward(distance) {
  this.position = add(this.position, scale(this.direction, distance));
}

moveRight(distance) {
  this.position = add(this.position, scale(this.right, distance));
}

moveUp(distance) {
  this.position = add(this.position, scale(this.up, distance));
}

pan(degrees) {
  const radians = (-degrees * Math.PI) / 180;
  
  const cosTheta = Math.cos(radians);
  const sinTheta = Math.sin(radians);
  
  const newDirX = this.direction.x * cosTheta - this.direction.z * sinTheta;
  const newDirZ = this.direction.x * sinTheta + this.direction.z * cosTheta;
  
  this.direction = new Vector3(newDirX, this.direction.y, newDirZ);
  this.direction = normalize(this.direction);
  
  this.right = normalize(cross(this.direction, this.up));
  this.up = normalize(cross(this.right, this.direction));
}
```

The bug is likely occurring because the camera's basis vectors are not being properly maintained after rotation.

## Expected Outcome
After fixing this bug:
1. Camera movement should be intuitive and consistent regardless of rotation
2. Moving forward should always move in the direction the camera is facing
3. The camera's coordinate system should remain orthogonal at all times

## Testing
1. Run the existing camera tests with `npm run test:module -- --dir tests/camera.test.js`
2. Focus particularly on the test "should maintain orthonormal basis after rotation"
3. Add additional tests if necessary to verify the fix works for all movement cases

Please find the bug, implement a fix, and verify it works by running the tests. Make sure to provide a clear explanation of what was causing the bug and how your fix addresses it.
```

### Example 3: Implementing Object Picking (for claude-3.7-sonnet)

```
# Implement Object Picking in WebGPU Raytracer

## Context
The WebGPU Interactive Raytracer currently allows users to add objects to the scene, but doesn't support selecting and manipulating individual objects. We need to implement object picking functionality so users can click on an object in the scene to select it.

## Task
Implement object picking functionality that allows users to click on the canvas to select objects in the scene. When an object is selected, it should be highlighted in some way and its properties should be displayed in a properties panel.

## Requirements
1. Implement a `pickObject` function that casts a ray from the camera through the clicked pixel to determine which object (if any) was clicked
2. Add event listeners to the canvas to handle mouse clicks
3. Create a simple properties panel that displays the selected object's properties
4. Provide visual feedback when an object is selected (e.g., render a wireframe or change its appearance)

## Code References

You'll need to modify or create the following files:

1. main.js - To add the event listeners and UI for the properties panel
2. js/renderer.js - To implement the picking functionality
3. js/scene-manager.js - To track the selected object

Here's a sketch of the `pickObject` function you'll need to implement:

```javascript
/**
 * Pick an object from the scene based on pixel coordinates
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Scene} scene - The scene to pick from
 * @param {Camera} camera - The camera to use for ray generation
 * @returns {string|null} - The ID of the picked object, or null if none was picked
 */
function pickObject(x, y, width, height, scene, camera) {
  // TODO: Implement object picking
  // 1. Generate a ray from the camera through the clicked pixel
  // 2. Find the nearest intersection with an object in the scene
  // 3. Return the object ID (or null if no intersection)
}
```

## Expected Outcome
After implementation, users should be able to:
1. Click on an object in the scene to select it
2. See visual feedback indicating which object is selected
3. View and potentially edit the object's properties in a properties panel
4. Deselect an object by clicking elsewhere

## Testing
1. Create tests for the pickObject function to verify it correctly identifies objects
2. Test with different object types (spheres, planes)
3. Test edge cases like clicking on overlapping objects or empty space
4. Verify that the properties panel correctly displays the selected object's properties

Implement this feature following TDD practices, and ensure your code is well-documented with JSDoc comments.
```

## Guidelines for Writing Effective Prompts

1. **Be specific**: Clearly define what needs to be implemented or fixed.
2. **Provide context**: Include enough background information for the AI to understand the task.
3. **Include code references**: Show relevant parts of the codebase to provide context.
4. **Set clear requirements**: List specific requirements and acceptance criteria.
5. **Suggest testing**: Describe how the implementation should be tested.
6. **Match the LLM**: Adjust the prompt complexity based on the LLM being used (o3-mini vs claude-3.7-sonnet).

## Model Selection Guidelines

- Use **o3-mini** for:
  - Simple bug fixes
  - Straightforward implementations
  - Code refactoring tasks
  - Testing and documentation

- Use **claude-3.7-sonnet** for:
  - Complex algorithm implementations
  - System architecture tasks
  - Performance optimization
  - Solving intricate bugs
  - Features requiring deep understanding of the codebase

By following these guidelines and examples, you can create effective prompts that help AI engineers implement features and fix issues in the WebGPU Interactive Raytracer project efficiently. 