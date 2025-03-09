/**
 * Raytracer implementation
 */
import { Vector3 as MathVector3, dot, normalize, subtract, add, scale, length } from './math.js';

// Re-export Vector3 for convenience
export { Vector3 } from './math.js';

/**
 * Represents a ray with origin and direction
 */
export class Ray {
  /**
   * Creates a ray
   * @param {MathVector3} origin - Origin point of the ray
   * @param {MathVector3} direction - Direction vector of the ray (should be normalized)
   */
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }

  /**
   * Compute a point along the ray
   * @param {number} t - Distance along the ray
   * @returns {MathVector3} Point at distance t along the ray
   */
  at(t) {
    return add(this.origin, scale(this.direction, t));
  }
}

/**
 * Represents a material with color and surface properties
 */
export class Material {
  /**
   * Creates a material
   * @param {Object} color - RGB color with r,g,b components between 0-1
   * @param {Object} options - Additional material options
   * @param {number} options.diffuse - Diffuse reflection coefficient (0-1)
   * @param {number} options.specular - Specular reflection coefficient (0-1)
   * @param {number} options.shininess - Shininess exponent for specular highlight
   * @param {number} options.ambient - Ambient light coefficient (0-1)
   * @param {number} options.reflection - Reflection coefficient (0-1)
   * @param {number} options.transparency - Transparency coefficient (0-1)
   * @param {number} options.refractiveIndex - Index of refraction (1.0 for air, 1.3-1.5 for glass)
   * @param {Object} options.texture - Optional texture object
   */
  constructor(color, options = {}) {
    this.color = color;
    this.diffuse = options.diffuse !== undefined ? options.diffuse : 0.7;
    this.specular = options.specular !== undefined ? options.specular : 0.3;
    this.shininess = options.shininess !== undefined ? options.shininess : 32;
    this.ambient = options.ambient !== undefined ? options.ambient : 0.1;
    this.reflection = options.reflection !== undefined ? options.reflection : 0.0;
    this.transparency = options.transparency !== undefined ? options.transparency : 0.0;
    this.refractiveIndex = options.refractiveIndex !== undefined ? options.refractiveIndex : 1.5;
    this.texture = options.texture;
  }

  /**
   * Get the color at a specific point on the material (for textured materials)
   * @param {MathVector3} point - The point to sample
   * @param {MathVector3} normal - The surface normal at the point
   * @returns {Object} - The RGB color at the point
   */
  getColorAt(point, normal) {
    if (!this.texture) {
      return this.color;
    }
    
    // Calculate UV coordinates using planar mapping
    // This is a simple implementation - more sophisticated mapping would depend on the geometry
    const u = (Math.atan2(normal.z, normal.x) / (2 * Math.PI)) + 0.5;
    const v = (Math.asin(normal.y) / Math.PI) + 0.5;
    
    return this.texture.getColorAtUV(u, v);
  }
}

/**
 * Represents an intersection between a ray and an object
 */
export class Intersection {
  /**
   * Creates an intersection
   * @param {MathVector3} point - Point of intersection
   * @param {number} distance - Distance from ray origin to intersection
   * @param {MathVector3} normal - Surface normal at intersection point
   * @param {Material} material - Material of the intersected object
   */
  constructor(point, distance, normal, material) {
    this.point = point;
    this.distance = distance;
    this.normal = normal;
    this.material = material;
  }
}

/**
 * Abstract base class for geometries
 */
export class Geometry {
  /**
   * Check for intersection with a ray
   * @param {Ray} ray - The ray to check intersection with
   * @returns {Intersection|null} Intersection data or null if no intersection
   */
  intersect(ray) {
    throw new Error('Method not implemented');
  }
}

/**
 * Sphere geometry
 * @extends Geometry
 */
export class Sphere extends Geometry {
  /**
   * Creates a sphere
   * @param {MathVector3} center - Center of the sphere
   * @param {number} radius - Radius of the sphere
   * @param {Material} material - Material of the sphere
   */
  constructor(center, radius, material) {
    super();
    this.center = center;
    this.radius = radius;
    this.material = material;
  }

  /**
   * Check for intersection with a ray
   * @param {Ray} ray - The ray to check intersection with
   * @returns {Intersection|null} Intersection data or null if no intersection
   */
  intersect(ray) {
    // Vector from ray origin to sphere center
    const oc = subtract(ray.origin, this.center);
    
    // Quadratic formula coefficients
    const a = dot(ray.direction, ray.direction);
    const b = 2.0 * dot(oc, ray.direction);
    const c = dot(oc, oc) - this.radius * this.radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return null; // No intersection
    }
    
    // Find the nearest root that lies in the acceptable range
    const sqrtDiscriminant = Math.sqrt(discriminant);
    
    // Try the first solution
    let t = (-b - sqrtDiscriminant) / (2.0 * a);
    if (t < 0.001) {
      // If the first solution is too close or behind the ray, try the second
      t = (-b + sqrtDiscriminant) / (2.0 * a);
      if (t < 0.001) {
        return null; // Both solutions are invalid
      }
    }
    
    // Calculate the intersection point
    const point = ray.at(t);
    
    // Calculate the normal (pointing outward from the sphere)
    const normal = normalize(subtract(point, this.center));
    
    return new Intersection(point, t, normal, this.material);
  }
}

/**
 * Plane geometry
 * @extends Geometry
 */
export class Plane extends Geometry {
  /**
   * Creates a plane
   * @param {MathVector3} point - A point on the plane
   * @param {MathVector3} normal - Normal vector of the plane (should be normalized)
   * @param {Material} material - Material of the plane
   */
  constructor(point, normal, material) {
    super();
    this.point = point;
    this.normal = normalize(normal);
    this.material = material;
  }

  /**
   * Check for intersection with a ray
   * @param {Ray} ray - The ray to check intersection with
   * @returns {Intersection|null} Intersection data or null if no intersection
   */
  intersect(ray) {
    const denom = dot(ray.direction, this.normal);
    
    // Check if ray is parallel to the plane (or nearly so)
    if (Math.abs(denom) < 0.0001) {
      return null;
    }
    
    // Check if ray is pointing away from the plane normal
    if (denom > 0) {
      return null;
    }
    
    const p0l0 = subtract(this.point, ray.origin);
    const t = dot(p0l0, this.normal) / denom;
    
    // Check if intersection is behind the ray
    if (t < 0.001) {
      return null;
    }
    
    const point = ray.at(t);
    
    return new Intersection(point, t, this.normal, this.material);
  }
}

/**
 * Represents a light in the scene
 */
export class Light {
  /**
   * Creates a light
   * @param {string} type - The type of light ('point' or 'directional')
   * @param {Object} options - Light options
   * @param {MathVector3} options.position - Position for point lights
   * @param {MathVector3} options.direction - Direction for directional lights
   * @param {Object} options.color - RGB color with r,g,b components between 0-1
   * @param {number} options.intensity - Light intensity (0-1)
   */
  constructor(type, options = {}) {
    this.type = type;
    this.position = options.position;
    this.direction = options.direction;
    this.color = options.color || { r: 1, g: 1, b: 1 };
    this.intensity = options.intensity !== undefined ? options.intensity : 1.0;
  }
}

/**
 * Scene containing all objects to render
 */
export class Scene {
  /**
   * Creates a scene
   */
  constructor() {
    this.objects = [];
    this.lights = [];
  }

  /**
   * Add an object to the scene
   * @param {Geometry} object - Object to add
   */
  addObject(object) {
    this.objects.push(object);
  }

  /**
   * Add a light to the scene
   * @param {Light} light - Light to add
   */
  addLight(light) {
    this.lights.push(light);
  }
}

/**
 * Find the nearest intersection between a ray and objects in a scene
 * @param {Ray} ray - The ray to trace
 * @param {Scene} scene - The scene containing objects
 * @returns {Intersection|null} The nearest intersection or null if none found
 */
export function computeRayIntersection(ray, scene) {
  let nearestIntersection = null;
  let nearestDistance = Infinity;
  
  for (const object of scene.objects) {
    const intersection = object.intersect(ray);
    
    if (intersection && intersection.distance < nearestDistance) {
      nearestIntersection = intersection;
      nearestDistance = intersection.distance;
    }
  }
  
  return nearestIntersection;
}

// Global settings for raytracing
export const raytracingSettings = {
  enableShadows: true,
  maxReflectionDepth: 3,
  samplesPerPixel: 1,
  enableRefraction: true
};

/**
 * Calculate the lighting at a point using the Phong illumination model
 * @param {Intersection} intersection - The intersection information
 * @param {Ray} ray - The viewing ray
 * @param {Scene} scene - The scene containing lights
 * @returns {Object} - The calculated RGB color
 */
export function calculateLighting(intersection, ray, scene) {
  const { point, normal, material } = intersection;
  const viewDir = scale(ray.direction, -1); // View direction points towards camera
  
  // Initialize with ambient light
  let result = {
    r: material.color.r * material.ambient,
    g: material.color.g * material.ambient,
    b: material.color.b * material.ambient
  };
  
  // Process each light
  for (const light of scene.lights) {
    let lightDir;
    let lightDistance = Infinity;
    
    if (light.type === 'directional') {
      // For directional lights, the direction is constant
      lightDir = scale(light.direction, -1); // Light direction points towards the light source
    } else if (light.type === 'point') {
      // For point lights, calculate direction from point to light
      const lightVector = subtract(light.position, point);
      lightDistance = length(lightVector);
      lightDir = normalize(lightVector);
    }
    
    // Check for shadows only if enabled
    let inShadow = false;
    if (raytracingSettings.enableShadows) {
      // Shoot a ray from the intersection point towards the light
      const shadowRay = new Ray(point, lightDir);
      const shadowIntersection = computeRayIntersection(shadowRay, scene);
      
      // If we hit something that's closer than the light, this point is in shadow
      if (shadowIntersection && shadowIntersection.distance < lightDistance) {
        inShadow = true;
      }
    }
    
    if (inShadow) {
      continue; // Skip this light as it's blocked
    }
    
    // Calculate diffuse component (Lambert's law)
    const lambertian = Math.max(dot(normal, lightDir), 0);
    
    // Calculate specular component (Phong model)
    let specular = 0;
    if (lambertian > 0) {
      // Calculate reflection direction
      const reflectDir = subtract(scale(normal, 2 * dot(normal, lightDir)), lightDir);
      // Calculate specular component
      specular = Math.pow(Math.max(dot(reflectDir, viewDir), 0), material.shininess);
    }
    
    // Calculate light intensity (falls off with distance for point lights)
    let intensity = light.intensity;
    if (light.type === 'point') {
      // Apply inverse square falloff
      intensity = intensity / (1 + 0.01 * lightDistance * lightDistance);
    }
    
    // Add diffuse contribution
    result.r += material.color.r * material.diffuse * lambertian * light.color.r * intensity;
    result.g += material.color.g * material.diffuse * lambertian * light.color.g * intensity;
    result.b += material.color.b * material.diffuse * lambertian * light.color.b * intensity;
    
    // Add specular contribution
    const specularIntensity = material.specular * specular * intensity;
    result.r += light.color.r * specularIntensity;
    result.g += light.color.g * specularIntensity;
    result.b += light.color.b * specularIntensity;
  }
  
  // Clamp values to [0,1] range
  result.r = Math.min(1, Math.max(0, result.r));
  result.g = Math.min(1, Math.max(0, result.g));
  result.b = Math.min(1, Math.max(0, result.b));
  
  return result;
}

/**
 * Calculate the reflection direction
 * @param {MathVector3} incident - Incident ray direction
 * @param {MathVector3} normal - Surface normal
 * @returns {MathVector3} - Reflection direction
 */
export function calculateReflection(incident, normal) {
  const dot_product = dot(incident, normal);
  return subtract(incident, scale(normal, 2 * dot_product));
}

/**
 * Calculate the refraction direction using Snell's law
 * @param {MathVector3} incident - Incident ray direction
 * @param {MathVector3} normal - Surface normal
 * @param {number} refrIndex - Ratio of refractive indices (n1/n2)
 * @returns {MathVector3|null} - Refraction direction, or null if total internal reflection
 */
export function calculateRefraction(incident, normal, refrIndex) {
  // Calculate the cosine of the angle between the normal and incident ray
  let cosi = dot(incident, normal);
  let etai = 1, etat = refrIndex;
  let n = normal;
  
  // Check if the ray is coming from inside the object
  if (cosi < 0) {
    cosi = -cosi;
  } else {
    // Swap the indices and invert the normal
    [etai, etat] = [etat, etai];
    n = scale(normal, -1);
  }
  
  const eta = etai / etat;
  
  // Calculate the discriminant for Snell's law equation
  const discriminant = 1 - eta * eta * (1 - cosi * cosi);
  
  // Check for total internal reflection
  if (discriminant <= 0) {
    return null; // Total internal reflection
  }
  
  // Calculate the refraction direction using Snell's law
  const refractedRay = add(
    scale(incident, eta),
    scale(n, eta * cosi - Math.sqrt(discriminant))
  );
  
  return normalize(refractedRay);
}

/**
 * Calculate the Fresnel reflection coefficient
 * @param {MathVector3} incident - Incident ray direction
 * @param {MathVector3} normal - Surface normal
 * @param {number} refrIndex - Ratio of refractive indices (n1/n2)
 * @returns {number} - Fresnel reflection coefficient (0-1)
 */
export function calculateFresnelReflection(incident, normal, refrIndex) {
  let cosi = dot(incident, normal);
  let etai = 1, etat = refrIndex;
  
  // Check if the ray is coming from inside the object
  if (cosi > 0) {
    [etai, etat] = [etat, etai];
  }
  
  // Compute sini using Snell's law
  const sint = etai / etat * Math.sqrt(Math.max(0, 1 - cosi * cosi));
  
  // Total internal reflection
  if (sint >= 1) {
    return 1;
  }
  
  const cost = Math.sqrt(Math.max(0, 1 - sint * sint));
  cosi = Math.abs(cosi);
  
  // Compute Fresnel equations
  const Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
  const Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
  
  // Return average of s-polarized and p-polarized reflectance
  return (Rs * Rs + Rp * Rp) / 2;
}

/**
 * Traces a ray recursively through the scene
 * @param {Ray} ray - The ray to trace
 * @param {Scene} scene - The scene containing objects
 * @param {Object} backgroundColor - RGB color to use for background
 * @param {number} depth - Current recursion depth
 * @returns {Object} RGB color for the ray
 */
export function traceRay(ray, scene, backgroundColor, depth = 0) {
  // Debug counter (only initialize on the first call)
  if (depth === 0 && typeof window._raytraceDebugCount === 'undefined') {
    window._raytraceDebugCount = { called: 0, hits: 0, misses: 0 };
  }
  
  if (depth === 0) {
    window._raytraceDebugCount.called++;
  }

  // Maximum recursion depth to prevent infinite reflections/refractions
  const MAX_DEPTH = 5;
  if (depth > MAX_DEPTH) {
    return backgroundColor;
  }

  // Find the nearest intersection
  const intersection = computeRayIntersection(ray, scene);
  
  if (!intersection) {
    if (depth === 0) {
      window._raytraceDebugCount.misses++;
      
      // Debug log every 100,000 rays
      if (window._raytraceDebugCount.called % 100000 === 0) {
        console.log('DEBUG: raytracer - rays:', window._raytraceDebugCount.called, 
                    'hits:', window._raytraceDebugCount.hits, 
                    'misses:', window._raytraceDebugCount.misses,
                    'hit rate:', ((window._raytraceDebugCount.hits / window._raytraceDebugCount.called) * 100).toFixed(2) + '%');
      }
    }
    return backgroundColor;
  }
  
  if (depth === 0) {
    window._raytraceDebugCount.hits++;
  }
  
  const { point, normal, material } = intersection;
  
  // Calculate basic lighting
  let color = calculateLighting(intersection, ray, scene);
  
  // Calculate reflections if the material is reflective
  if (material.reflection > 0) {
    // Calculate reflection direction
    const reflectDir = calculateReflection(ray.direction, normal);
    
    // Create a reflection ray (offset slightly to avoid self-intersection)
    const reflectOrigin = add(point, scale(normal, 0.001));
    const reflectRay = new Ray(reflectOrigin, reflectDir);
    
    // Trace the reflection ray
    const reflectColor = traceRay(reflectRay, scene, backgroundColor, depth + 1);
    
    // Blend the reflected color with the local color
    color = {
      r: color.r * (1 - material.reflection) + reflectColor.r * material.reflection,
      g: color.g * (1 - material.reflection) + reflectColor.g * material.reflection,
      b: color.b * (1 - material.reflection) + reflectColor.b * material.reflection
    };
  }
  
  // Calculate refractions if the material is transparent and refraction is enabled
  if (material.transparency > 0 && raytracingSettings.enableRefraction) {
    // Calculate Fresnel reflection coefficient
    const fresnelReflect = calculateFresnelReflection(ray.direction, normal, material.refractiveIndex);
    
    // Calculate refraction direction
    const refractDir = calculateRefraction(ray.direction, normal, material.refractiveIndex);
    
    // If there's no total internal reflection
    if (refractDir) {
      // Create a refraction ray (offset slightly to avoid self-intersection)
      const refractOrigin = subtract(point, scale(normal, 0.001)); // Move slightly inside the object
      const refractRay = new Ray(refractOrigin, refractDir);
      
      // Trace the refraction ray
      const refractColor = traceRay(refractRay, scene, backgroundColor, depth + 1);
      
      // Blend the refracted color with the current color using Fresnel coefficient
      const transparency = material.transparency * (1 - fresnelReflect);
      color = {
        r: color.r * (1 - transparency) + refractColor.r * transparency,
        g: color.g * (1 - transparency) + refractColor.g * transparency,
        b: color.b * (1 - transparency) + refractColor.b * transparency
      };
    }
  }
  
  // Ensure color values are in the valid range
  color.r = Math.min(1, Math.max(0, color.r));
  color.g = Math.min(1, Math.max(0, color.g));
  color.b = Math.min(1, Math.max(0, color.b));
  
  return color;
}

/**
 * Raytrace a single pixel
 * @param {number} x - Pixel x coordinate
 * @param {number} y - Pixel y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Scene} scene - Scene to render
 * @param {Object} backgroundColor - RGB color to use for background
 * @returns {Object} RGB color for the pixel
 */
export function raytracePixel(x, y, width, height, scene, backgroundColor) {
  // Convert pixel coordinates to normalized device coordinates (-1 to 1)
  const ndcX = (x / width) * 2 - 1;
  const ndcY = 1 - (y / height) * 2; // Flip Y axis
  
  // Create a ray from (0,0,0) pointing into the scene
  const origin = new MathVector3(0, 0, 0);
  const direction = normalize(new MathVector3(ndcX, ndcY, 1));
  const ray = new Ray(origin, direction);
  
  // Use recursive ray tracing instead of just direct lighting
  return traceRay(ray, scene, backgroundColor, 0);
} 