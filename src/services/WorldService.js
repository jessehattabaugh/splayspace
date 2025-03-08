const WorldChunk = require('../domain/models/World');
const { generateTerrain } = require('../shared/terrain-generator');
const { getRandomResourceType } = require('../shared/utils');

/**
 * Handles world-related operations
 */
class WorldService {
  constructor(worldRepository, messagingService, logger) {
    this.worldRepository = worldRepository;
    this.messagingService = messagingService;
    this.logger = logger || console;
    this.chunkSize = 100; // Default chunk size
    console.log('🌍 World service initialized 🏔️ constructor');
  }

  /**
   * Get or generate a world chunk
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkY - Chunk Y coordinate
   * @returns {Promise<WorldChunk>} - The world chunk
   */
  async getOrCreateChunk(chunkX, chunkY) {
    const chunkId = `${chunkX}:${chunkY}`;
    
    console.log('🌍 Requesting world chunk 🧩 getOrCreateChunk', { chunkX, chunkY });
    
    // Try to get existing chunk
    let chunk = await this.worldRepository.getChunk(chunkId);
    
    // If not found, generate a new one
    if (!chunk) {
      console.log('🌍 Chunk not found, generating new terrain 🔄 getOrCreateChunk', { chunkX, chunkY });
      
      const terrain = generateTerrain(chunkX, chunkY, this.chunkSize);
      const resources = this.generateResourcesForChunk(chunkX, chunkY);
      
      chunk = new WorldChunk({
        worldId: chunkId,
        chunkX,
        chunkY,
        terrain,
        resources
      });
      
      console.log('🌍 Saving new world chunk 💾 getOrCreateChunk', { 
        chunkId, 
        resourceCount: resources.length 
      });
      
      await this.worldRepository.saveChunk(chunk);
    } else {
      console.debug('🌍 Using existing chunk from database 📦 getOrCreateChunk', { 
        chunkId, 
        resourceCount: chunk.resources?.length || 0 
      });
    }
    
    return chunk;
  }

  /**
   * Generate resources for a new chunk
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkY - Chunk Y coordinate
   * @returns {Array} - Generated resources
   */
  generateResourcesForChunk(chunkX, chunkY) {
    console.debug('🌍 Generating resources for chunk ✨ generateResourcesForChunk', { chunkX, chunkY });
    
    const resources = [];
    const baseX = chunkX * this.chunkSize;
    const baseY = chunkY * this.chunkSize;
    
    // Generate between 0-5 resources per chunk
    const numResources = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numResources; i++) {
      const x = baseX + Math.floor(Math.random() * this.chunkSize);
      const y = baseY + Math.floor(Math.random() * this.chunkSize);
      
      resources.push({
        id: `res:${chunkX}:${chunkY}:${i}`,
        type: getRandomResourceType(),
        position: { x, y },
        quantity: Math.floor(Math.random() * 10) + 1
      });
    }
    
    console.debug('🌍 Generated resources 📊 generateResourcesForChunk', { 
      chunkX, 
      chunkY, 
      count: resources.length 
    });
    
    return resources;
  }

  /**
   * Send chunk data to a specific user
   * @param {WorldChunk} chunk - The chunk to send
   * @param {User} user - The user to send the chunk to
   * @returns {Promise<void>}
   */
  async sendChunkToUser(chunk, user) {
    console.log('🌍 Sending chunk to user 📤 sendChunkToUser', { 
      chunkId: chunk.worldId, 
      userId: user.userId
    });
    
    await this.messagingService.sendToUser(user.connectionId, {
      type: 'WORLD_CHUNK_DATA',
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      data: chunk
    });
  }
}

module.exports = WorldService;
