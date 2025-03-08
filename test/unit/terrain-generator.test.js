import { describe, it, expect } from 'vitest';
import { generateTerrain } from '../../src/shared/terrain-generator';

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
  
  it('should generate different terrain for different chunks', () => {
    const terrain1 = generateTerrain(0, 0, 5);
    const terrain2 = generateTerrain(1, 0, 5);
    
    // Check that at least some cells are different
    let hasDifference = false;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (terrain1[y][x].type !== terrain2[y][x].type) {
          hasDifference = true;
          break;
        }
      }
      if (hasDifference) break;
    }
    
    expect(hasDifference).toBe(true);
  });
  
  it('should mark appropriate terrain types as walkable', () => {
    const terrain = generateTerrain(0, 0, 20);
    
    // Check walkable property matches expected values for different terrain types
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const cell = terrain[y][x];
        if (['grass', 'sand', 'dirt', 'path'].includes(cell.type)) {
          expect(cell.walkable).toBe(true);
        } else {
          expect(cell.walkable).toBe(false);
        }
      }
    }
  });
});
