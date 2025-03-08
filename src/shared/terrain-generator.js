import { createNoise2D } from 'simplex-noise';

const BIOMES = {
  FOREST: 'forest',
  PLAINS: 'plains',
  DESERT: 'desert',
  MOUNTAIN: 'mountain',
  DUNGEON: 'dungeon'
};

const TILES = {
  GRASS: { type: 'grass', walkable: true, emoji: '🌱' },
  TREE: { type: 'tree', walkable: false, emoji: '🌲', harvestable: true, resource: 'wood' },
  ROCK: { type: 'rock', walkable: false, emoji: '🪨', harvestable: true, resource: 'stone' },
  WATER: { type: 'water', walkable: false, emoji: '💧' },
  SAND: { type: 'sand', walkable: true, emoji: '🏖️' },
  WALL: { type: 'wall', walkable: false, emoji: '🧱' },
  FLOOR: { type: 'floor', walkable: true, emoji: '⬜' }
};

export function generateTerrain(chunkX, chunkY, size) {
  const noise2D = createNoise2D();
  const terrain = [];
  const scale = 0.05;
  
  for (let y = 0; y < size; y++) {
    terrain[y] = [];
    for (let x = 0; x < size; x++) {
      const worldX = chunkX * size + x;
      const worldY = chunkY * size + y;
      
      // Generate base noise for elevation
      const elevation = (noise2D(worldX * scale, worldY * scale) + 1) / 2;
      
      // Generate biome noise
      const biomeNoise = noise2D(worldX * 0.02, worldY * 0.02);
      
      // Determine if this is a dungeon entrance
      const isDungeon = noise2D(worldX * 0.01, worldY * 0.01) > 0.8;
      
      let tile;
      if (isDungeon) {
        tile = generateDungeonTile(worldX, worldY, noise2D);
      } else {
        tile = generateBiomeTile(elevation, biomeNoise);
      }
      
      terrain[y][x] = tile;
    }
  }
  
  return terrain;
}

function generateBiomeTile(elevation, biomeNoise) {
  if (elevation < 0.3) {
    return { ...TILES.WATER };
  } else if (elevation < 0.4) {
    return { ...TILES.SAND };
  } else if (elevation < 0.7) {
    // Plains and forests
    return biomeNoise > 0.2 ? { ...TILES.TREE } : { ...TILES.GRASS };
  } else {
    // Mountains
    return { ...TILES.ROCK };
  }
}

function generateDungeonTile(x, y, noise2D) {
  const dungeonNoise = noise2D(x * 0.2, y * 0.2);
  
  if (dungeonNoise > 0.6) {
    return { ...TILES.WALL };
  } else {
    return { ...TILES.FLOOR };
  }
}
