import { describe, it, expect, vi } from 'vitest';
import { generateTerrain } from '../src/shared/terrain-generator';

describe('Terrain Generator', () => {
  it('should generate terrain for a chunk', () => {
    const terrain = generateTerrain(0, 0, 10); // Small chunk for testing
    
    expect(terrain).toBeDefined();
    expect(Array.isArray(terrain)).toBe(true);
    expect(terrain.length).toBe(10);
    expect(Array.isArray(terrain[0])).toBe(true);
    expect(terrain[0].length).toBe(10);
    
    // Check that terrain cells have the expected properties
    const cell = terrain[0][0];
    expect(cell).toHaveProperty('type');
    expect(cell).toHaveProperty('elevation');
    expect(cell).toHaveProperty('walkable');
  });
});
