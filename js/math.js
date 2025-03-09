/**
 * Vector and math utilities for raytracing operations
 */

/**
 * 3D vector class
 */
export class Vector3 {
  /**
   * Creates a 3D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @param {number} z - Z component
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

/**
 * Calculates the dot product of two vectors
 * @param {Vector3} v1 - First vector
 * @param {Vector3} v2 - Second vector
 * @returns {number} Dot product
 */
export function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Calculates the cross product of two vectors
 * @param {Vector3} v1 - First vector
 * @param {Vector3} v2 - Second vector
 * @returns {Vector3} Cross product
 */
export function cross(v1, v2) {
  return new Vector3(
    v1.y * v2.z - v1.z * v2.y,
    v1.z * v2.x - v1.x * v2.z,
    v1.x * v2.y - v1.y * v2.x
  );
}

/**
 * Calculates the length (magnitude) of a vector
 * @param {Vector3} v - Vector
 * @returns {number} Length
 */
export function length(v) {
  return Math.sqrt(dot(v, v));
}

/**
 * Normalizes a vector (makes it unit length)
 * @param {Vector3} v - Vector to normalize
 * @returns {Vector3} Normalized vector
 */
export function normalize(v) {
  const len = length(v);
  if (len === 0) {
    return new Vector3(0, 0, 0);
  }
  return new Vector3(v.x / len, v.y / len, v.z / len);
}

/**
 * Adds two vectors
 * @param {Vector3} v1 - First vector
 * @param {Vector3} v2 - Second vector
 * @returns {Vector3} Sum vector
 */
export function add(v1, v2) {
  return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

/**
 * Subtracts the second vector from the first
 * @param {Vector3} v1 - First vector
 * @param {Vector3} v2 - Second vector
 * @returns {Vector3} Difference vector
 */
export function subtract(v1, v2) {
  return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

/**
 * Scales a vector by a scalar
 * @param {Vector3} v - Vector
 * @param {number} s - Scalar
 * @returns {Vector3} Scaled vector
 */
export function scale(v, s) {
  return new Vector3(v.x * s, v.y * s, v.z * s);
} 