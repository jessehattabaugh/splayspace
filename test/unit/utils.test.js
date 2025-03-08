import { describe, it, expect, vi } from 'vitest';
import { distance, getRandomColor, getRandomResourceType } from '../../src/shared/utils';

describe('Utility Functions', () => {
  describe('distance', () => {
    it('should calculate distance between two points correctly', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      
      const result = distance(pos1, pos2);
      expect(result).toBe(5); // 3-4-5 triangle
    });
    
    it('should return 0 for identical positions', () => {
      const pos = { x: 10, y: 20 };
      expect(distance(pos, pos)).toBe(0);
    });
  });
  
  describe('getRandomColor', () => {
    it('should return a valid color', () => {
      const validColors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow'];
      const color = getRandomColor();
      expect(validColors).toContain(color);
    });
  });
  
  describe('getRandomResourceType', () => {
    it('should return a valid resource type', () => {
      const validTypes = ['stone', 'wood', 'metal', 'crystal', 'fabric'];
      const type = getRandomResourceType();
      expect(validTypes).toContain(type);
    });
  });
});
