/**
 * World chunk domain model
 */
class WorldChunk {
  constructor({
    worldId,
    chunkX,
    chunkY,
    terrain,
    resources = [],
    createdAt = Date.now()
  }) {
    this.worldId = worldId || `${chunkX}:${chunkY}`;
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.terrain = terrain;
    this.resources = resources;
    this.createdAt = createdAt;
  }

  /**
   * Add a resource to this chunk
   * @param {Object} resource - Resource to add
   */
  addResource(resource) {
    this.resources.push(resource);
  }

  /**
   * Remove a resource from this chunk
   * @param {string} resourceId - ID of resource to remove
   */
  removeResource(resourceId) {
    const index = this.resources.findIndex(r => r.id === resourceId);
    if (index !== -1) {
      this.resources.splice(index, 1);
    }
  }

  /**
   * Create a database representation of this chunk
   * @returns {Object} Database object
   */
  toDb() {
    return {
      worldId: this.worldId,
      terrain: this.terrain,
      resources: this.resources,
      createdAt: this.createdAt
    };
  }
}

module.exports = WorldChunk;
