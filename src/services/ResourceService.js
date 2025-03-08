const Resource = require('../domain/models/Resource');

/**
 * Handles resource-related operations
 */
class ResourceService {
  constructor(resourceRepository, userRepository, messagingService, logger) {
    this.resourceRepository = resourceRepository;
    this.userRepository = userRepository;
    this.messagingService = messagingService;
    this.logger = logger || console;
    console.log('🔮 Resource service initialized 🧿 constructor');
  }

  /**
   * Collect a resource and add it to user's inventory
   * @param {string} resourceId - ID of the resource to collect
   * @param {User} user - The user collecting the resource
   * @returns {Promise<Resource|null>} - The collected resource or null if not found
   */
  async collectResource(resourceId, user) {
    console.log('🔮 Attempting to collect resource 🧤 collectResource', { 
      resourceId, 
      userId: user.userId
    });
    
    // Get the resource
    const resource = await this.resourceRepository.getResource(resourceId);
    if (!resource) {
      console.log('🔮 Resource not found for collection ❓ collectResource', { resourceId });
      return null;
    }
    
    // Check if too far away (optional distance check)
    if (resource.position && user.position) {
      const dx = resource.position.x - user.position.x;
      const dy = resource.position.y - user.position.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance > 5) { // Maximum collection distance
        console.log('🔮 Resource too far away to collect 📏 collectResource', { 
          resourceId, 
          userId: user.userId, 
          distance
        });
        return null;
      }
    }
    
    // Add to user inventory
    user.addResource(resource);
    await this.userRepository.saveUser(user);
    
    // Remove from world
    await this.resourceRepository.deleteResource(resourceId);
    
    // Notify user of the collection
    await this.messagingService.sendToUser(user.connectionId, {
      type: 'RESOURCE_COLLECTED',
      resourceId,
      resource
    });
    
    console.log('🔮 Resource successfully collected ✅ collectResource', {
      resourceId,
      type: resource.type,
      userId: user.userId
    });
    
    return resource;
  }

  /**
   * Create an art piece as a resource in the world
   * @param {Object} artData - Art pixel data
   * @param {Object} position - Position in the world
   * @param {User} creator - The user creating the art
   * @returns {Promise<Resource>} - The created art resource
   */
  async createArt(artData, position, creator) {
    console.log('🔮 Creating new art resource 🎨 createArt', { 
      userId: creator.userId,
      position,
      artSize: artData ? `${artData.width}x${artData.height}` : 'unknown'
    });
    
    const resourceId = `art:${creator.userId}:${Date.now()}`;
    
    const artResource = new Resource({
      id: resourceId,
      type: 'art',
      position,
      creator: creator.userId,
      data: artData,
      createdAt: Date.now()
    });
    
    // Save to database
    await this.resourceRepository.saveResource(artResource);
    
    // Get nearby users to notify
    const allUsers = await this.userRepository.findAll();
    const nearbyUsers = allUsers.filter(user => {
      if (user.userId === creator.userId) return true; // Always include creator
      
      const dx = user.position.x - position.x;
      const dy = user.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < 100; // Visible within 100 units
    });
    
    console.log('🔮 Notifying nearby users about new art 📣 createArt', {
      resourceId,
      nearbyUserCount: nearbyUsers.length
    });
    
    // Notify nearby users about the new art
    for (const user of nearbyUsers) {
      await this.messagingService.sendToUser(user.connectionId, {
        type: 'NEW_ART_CREATED',
        resourceId,
        creator: creator.userId,
        position,
        data: artData
      });
    }
    
    return artResource;
  }
}

module.exports = ResourceService;
