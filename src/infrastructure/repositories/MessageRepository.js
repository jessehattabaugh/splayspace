/**
 * Repository for standardized message handling
 */
class MessageRepository {
  constructor(websocketService, logger) {
    this.websocketService = websocketService;
    this.logger = logger || console;
  }

  /**
   * Send a user joined message
   * @param {Object} user - The user who joined
   * @param {Array} excludeConnections - Connections to exclude
   */
  async sendUserJoined(user, excludeConnections = []) {
    await this.websocketService.broadcastMessage({
      type: 'USER_JOINED',
      user: user.toPublic()
    }, excludeConnections);
  }

  /**
   * Send a user left message
   * @param {Object} user - The user who left
   * @param {Array} excludeConnections - Connections to exclude
   */
  async sendUserLeft(user, excludeConnections = []) {
    await this.websocketService.broadcastMessage({
      type: 'USER_LEFT',
      userId: user.userId
    }, excludeConnections);
  }

  /**
   * Send a user moved message
   * @param {Object} user - The user who moved
   * @param {Array} excludeConnections - Connections to exclude
   */
  async sendUserMoved(user, excludeConnections = []) {
    await this.websocketService.broadcastMessage({
      type: 'USER_MOVED',
      userId: user.userId,
      position: user.position
    }, excludeConnections);
  }

  /**
   * Send a chat message
   * @param {string} message - The chat message
   * @param {Object} user - The user who sent the message
   * @param {Array} excludeConnections - Connections to exclude
   */
  async sendChatMessage(message, user, excludeConnections = []) {
    await this.websocketService.broadcastMessage({
      type: 'CHAT_MESSAGE',
      userId: user.userId,
      username: user.username || user.userId.substring(0, 5),
      message,
      timestamp: Date.now()
    }, excludeConnections);
  }

  /**
   * Send a world chunk to a user
   * @param {Object} chunk - The world chunk
   * @param {Object} user - The user to send to
   */
  async sendWorldChunk(chunk, user) {
    await this.websocketService.sendToUser(user.connectionId, {
      type: 'WORLD_CHUNK_DATA',
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      data: {
        terrain: chunk.terrain,
        resources: chunk.resources
      }
    });
  }

  /**
   * Send a notification about a collected resource
   * @param {string} resourceId - The resource ID
   * @param {Object} resource - The resource data
   * @param {Object} user - The user who collected it
   */
  async sendResourceCollected(resourceId, resource, user) {
    await this.websocketService.sendToUser(user.connectionId, {
      type: 'RESOURCE_COLLECTED',
      resourceId,
      resource
    });
  }

  /**
   * Notify about new art created
   * @param {Object} artResource - The art resource
   * @param {Array} notifyUsers - Users to notify
   */
  async sendArtCreated(artResource, notifyUsers) {
    const message = {
      type: 'NEW_ART_CREATED',
      resourceId: artResource.id,
      creator: artResource.creator,
      position: artResource.position,
      data: artResource.data
    };

    for (const user of notifyUsers) {
      await this.websocketService.sendToUser(user.connectionId, message);
    }
  }

  /**
   * Send a system message to a user
   * @param {string} message - The message
   * @param {Object} user - The user to receive the message
   */
  async sendSystemMessage(message, user) {
    await this.websocketService.sendToUser(user.connectionId, {
      type: 'SYSTEM_MESSAGE',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Send an error message to a user
   * @param {string} message - The error message
   * @param {Object} user - The user to receive the message
   */
  async sendError(message, user) {
    await this.websocketService.sendToUser(user.connectionId, {
      type: 'ERROR',
      message,
      timestamp: Date.now()
    });
  }
}

module.exports = MessageRepository;
