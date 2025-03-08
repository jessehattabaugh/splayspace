const WorldChunk = require('../../domain/models/World');

/**
 * Repository for world data access
 */
class WorldRepository {
  constructor(dynamoTables) {
    this.tables = dynamoTables;
  }

  /**
   * Get a chunk by ID
   * @param {string} worldId - World chunk ID (format: 'x:y')
   * @returns {Promise<WorldChunk|null>}
   */
  async getChunk(worldId) {
    const result = await this.tables.worlds.get({ worldId });
    if (!result) return null;
    
    // Parse chunk coordinates from the ID
    const [chunkX, chunkY] = worldId.split(':').map(Number);
    
    return new WorldChunk({
      ...result,
      chunkX,
      chunkY
    });
  }

  /**
   * Save a world chunk
   * @param {WorldChunk} chunk - World chunk to save
   * @returns {Promise<WorldChunk>}
   */
  async saveChunk(chunk) {
    await this.tables.worlds.put(chunk.toDb());
    return chunk;
  }

  /**
   * Get chunks in a region
   * @param {number} minX - Minimum X coordinate
   * @param {number} minY - Minimum Y coordinate
   * @param {number} maxX - Maximum X coordinate
   * @param {number} maxY - Maximum Y coordinate
   * @returns {Promise<WorldChunk[]>}
   */
  async getChunksInRegion(minX, minY, maxX, maxY) {
    // Unfortunately, DynamoDB doesn't support easy region queries
    // For a production app, we might need a more sophisticated query or secondary indexes
    
    // For now, we'll just scan all chunks (this is inefficient for large worlds)
    const result = await this.tables.worlds.scan({});
    
    if (!result.Items) return [];
    
    return result.Items
      .map(item => {
        if (!item.worldId) return null;
        
        const [chunkX, chunkY] = item.worldId.split(':').map(Number);
        
        // Filter to only chunks within the region
        if (chunkX < minX || chunkX > maxX || chunkY < minY || chunkY > maxY) {
          return null;
        }
        
        return new WorldChunk({
          ...item,
          chunkX,
          chunkY
        });
      })
      .filter(chunk => chunk !== null);
  }
}

module.exports = WorldRepository;
