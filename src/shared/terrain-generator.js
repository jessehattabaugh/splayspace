const { createNoise2D } = require('simplex-noise');

// Create noise generators with different seeds for variety
const elevationNoise = createNoise2D();
const moistureNoise = createNoise2D();
const temperatureNoise = createNoise2D();

/**
 * Generate terrain for a chunk at coordinates
 */
function generateTerrain(chunkX, chunkY, chunkSize = 100) {
  const terrain = [];
  const scale = 0.01;
  const baseX = chunkX * chunkSize;
  const baseY = chunkY * chunkSize;
  
  for (let y = 0; y < chunkSize; y++) {
    const row = [];
    for (let x = 0; x < chunkSize; x++) {
      const worldX = baseX + x;
      const worldY = baseY + y;
      
      // Generate terrain values using multiple octaves of noise
      const elevation = getElevation(worldX, worldY, scale);
      const moisture = getMoisture(worldX, worldY, scale);
      const temperature = getTemperature(worldX, worldY, scale);
      
      // Determine terrain type based on values
      const type = getTerrainType(elevation, moisture, temperature);
      
      row.push({
        type,
        elevation,
        walkable: ['grass', 'sand', 'dirt', 'path'].includes(type)
      });
    }
    terrain.push(row);
  }
  
  return terrain;
}

function getElevation(x, y, scale) {
  // Use multiple octaves for more natural terrain
  let elevation = 0;
  let amplitude = 1;
  let frequency = 1;
  const octaves = 4;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    elevation += amplitude * elevationNoise(x * scale * frequency, y * scale * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  // Normalize to [0, 1]
  elevation = (elevation / maxValue + 1) * 0.5;
  return elevation;
}

function getMoisture(x, y, scale) {
  return (moistureNoise(x * scale, y * scale) + 1) * 0.5;
}

function getTemperature(x, y, scale) {
  return (temperatureNoise(x * scale, y * scale) + 1) * 0.5;
}

function getTerrainType(elevation, moisture, temperature) {
  if (elevation < 0.3) {
    return 'water';
  }
  if (elevation < 0.4) {
    return 'sand';
  }
  if (elevation > 0.8) {
    if (temperature < 0.3) return 'snow';
    return 'mountain';
  }
  if (elevation > 0.6) {
    return 'rock';
  }
  if (moisture > 0.6) {
    return 'forest';
  }
  if (moisture > 0.3) {
    return 'grass';
  }
  return 'dirt';
}

module.exports = {
  generateTerrain
};
