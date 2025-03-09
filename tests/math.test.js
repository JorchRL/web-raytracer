/**
 * Tests for the math module
 */
import { describe, it, expect } from 'vitest';
import { Vector3, dot, cross, normalize, subtract, add, scale, length } from '../js/math.js';

describe('Math Module', () => {
  describe('Vector3', () => {
    it('should create a Vector3 with x, y, z components', () => {
      const vec = new Vector3(1, 2, 3);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    it('should have a default value of (0,0,0)', () => {
      const vec = new Vector3();
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
      expect(vec.z).toBe(0);
    });
  });

  describe('vector operations', () => {
    it('should calculate dot product correctly', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      expect(dot(v1, v2)).toBe(1*4 + 2*5 + 3*6);
    });

    it('should calculate cross product correctly', () => {
      const v1 = new Vector3(1, 0, 0);
      const v2 = new Vector3(0, 1, 0);
      const result = cross(v1, v2);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(1);
    });

    it('should normalize a vector correctly', () => {
      const v = new Vector3(3, 0, 0);
      const normalized = normalize(v);
      expect(normalized.x).toBeCloseTo(1);
      expect(normalized.y).toBeCloseTo(0);
      expect(normalized.z).toBeCloseTo(0);
      expect(length(normalized)).toBeCloseTo(1);
    });

    it('should handle zero vector normalization gracefully', () => {
      const v = new Vector3(0, 0, 0);
      const normalized = normalize(v);
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
      expect(normalized.z).toBe(0);
    });

    it('should subtract vectors correctly', () => {
      const v1 = new Vector3(5, 6, 7);
      const v2 = new Vector3(1, 2, 3);
      const result = subtract(v1, v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(4);
      expect(result.z).toBe(4);
    });

    it('should add vectors correctly', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      const result = add(v1, v2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
      expect(result.z).toBe(9);
    });

    it('should scale a vector correctly', () => {
      const v = new Vector3(1, 2, 3);
      const scaled = scale(v, 2);
      expect(scaled.x).toBe(2);
      expect(scaled.y).toBe(4);
      expect(scaled.z).toBe(6);
    });

    it('should calculate vector length correctly', () => {
      const v = new Vector3(3, 4, 0);
      expect(length(v)).toBe(5);
    });
  });
}); 