/**
 * Handlers for different WebSocket message types
 */
class MessageHandlers {
  constructor({ userService, worldService, resourceService, chatService, logger }) {
    this.userService = userService;
    this.worldService = worldService;
    this.resourceService = resourceService;
    this.chatService = chatService;
    this.logger = logger;
    
    console.debug('📝 Message handlers initialized 🧩 constructor');
    
    // Bind handlers to maintain this context
    this.handleMove = this.handleMove.bind(this);
    this.handleGetWorldChunk = this.handleGetWorldChunk.bind(this);
    this.handleChatMessage = this.handleChatMessage.bind(this);
    this.handleCollectResource = this.handleCollectResource.bind(this);
    this.handleCreateArt = this.handleCreateArt.bind(this);
  }

  /**
   * Get the handler function for a specific message type
   * @param {string} type - The message type
   * @returns {Function|null} Handler function or null if not found
   */
  getHandlerForType(type) {
    const handlers = {
      'MOVE': this.handleMove,
      'GET_WORLD_CHUNK': this.handleGetWorldChunk,
      'CHAT_MESSAGE': this.handleChatMessage,
      'COLLECT_RESOURCE': this.handleCollectResource,
      'CREATE_ART': this.handleCreateArt
    };
    
    const handler = handlers[type];
    if (!handler) {
      console.debug('📝 No handler found for message type ❓ getHandlerForType', { type });
    }
    
    return handler || null;
  }

  /**
   * Handle user movement
   * @param {Object} user - The user who sent the message
   * @param {Object} payload - Message payload with x,y coordinates
   */
  async handleMove(user, { x, y }) {
    console.debug('📝 Handling user movement 🚶 handleMove', { 
      userId: user.userId, 
      from: { x: user.position.x, y: user.position.y },
      to: { x, y }
    });
    
    // Update user position
    await this.userService.updatePosition(user, { x, y });
    
    // Notify other users
    await this.userService.notifyUserMoved(user);
  }

  /**
   * Handle request for world chunk data
   * @param {Object} user - The user who sent the message
   * @param {Object} payload - Message payload with chunk coordinates
   */
  async handleGetWorldChunk(user, { chunkX, chunkY }) {
    console.log('📝 Handling world chunk request 🗺️ handleGetWorldChunk', { 
      userId: user.userId, 
      chunkX, 
      chunkY 
    });
    
    const chunk = await this.worldService.getOrCreateChunk(chunkX, chunkY);
    console.debug('📝 World chunk retrieved or created 📦 handleGetWorldChunk', {
      chunkId: chunk.worldId,
      resourceCount: chunk.resources ? chunk.resources.length : 0
    });
    
    await this.worldService.sendChunkToUser(chunk, user);
  }

  /**
   * Handle chat message
   * @param {Object} user - The user who sent the message
   * @param {Object} payload - Message payload with message text
   */
  async handleChatMessage(user, { message }) {
    console.log('📝 Handling chat message 💬 handleChatMessage', { 
      userId: user.userId, 
      messageLength: message?.length 
    });
    
    if (!message || typeof message !== 'string') {
      console.log('📝 Invalid chat message received ⚠️ handleChatMessage', { userId: user.userId });
      this.logger.warn('Invalid chat message', { userId: user.userId });
      return;
    }
    
    // Safety: Trim and limit message length
    const sanitizedMessage = message.trim().slice(0, 500);
    
    await this.chatService.sendMessage(sanitizedMessage, user);
    
    console.debug('📝 Chat message broadcast complete ✅ handleChatMessage', { 
      userId: user.userId,
      messageLength: sanitizedMessage.length
    });
  }

  /**
   * Handle resource collection
   * @param {Object} user - The user who sent the message
   * @param {Object} payload - Message payload with resourceId
   */
  async handleCollectResource(user, { resourceId }) {
    console.log('📝 Handling resource collection 🧰 handleCollectResource', { 
      userId: user.userId, 
      resourceId 
    });
    
    if (!resourceId) {
      console.log('📝 Invalid resource collection request ⚠️ handleCollectResource', { userId: user.userId });
      this.logger.warn('Invalid resource collection', { userId: user.userId });
      return;
    }
    
    const resource = await this.resourceService.collectResource(resourceId, user);
    
    if (!resource) {
      console.log('📝 Resource not found for collection ❌ handleCollectResource', { 
        userId: user.userId, 
        resourceId 
      });
      
      this.logger.warn('Resource not found for collection', { 
        userId: user.userId, 
        resourceId 
      });
    } else {
      console.log('📝 Resource successfully collected ✅ handleCollectResource', {
        userId: user.userId,
        resourceId,
        resourceType: resource.type
      });
    }
  }

  /**
   * Handle art creation
   * @param {Object} user - The user who sent the message
   * @param {Object} payload - Message payload with art data and position
   */
  async handleCreateArt(user, { art, position }) {
    console.log('📝 Handling art creation 🎨 handleCreateArt', { 
      userId: user.userId, 
      position,
      artSize: art ? `${art.width}x${art.height}` : 'unknown'
    });
    
    if (!art || !position) {
      console.log('📝 Invalid art creation request ⚠️ handleCreateArt', { userId: user.userId });
      this.logger.warn('Invalid art creation', { userId: user.userId });
      return;
    }
    
    const createdArt = await this.resourceService.createArt(art, position, user);
    
    console.log('📝 Art successfully created in world ✨ handleCreateArt', {
      userId: user.userId,
      resourceId: createdArt.id,
      position
    });
  }
}

module.exports = MessageHandlers;
