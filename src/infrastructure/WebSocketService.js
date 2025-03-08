/**
 * Service for WebSocket communication with better error handling
 * and performance optimizations
 */
class WebSocketService {
  constructor(arc, logger) {
    this.arc = arc;
    this.logger = logger || console;
    this.cachedWebsocket = null;
    console.log('🔌 WebSocket service initialized 🚀 constructor');
  }

  /**
   * Get WebSocket connection with caching for performance
   * @returns {Promise<Object>} WebSocket connection
   */
  async getWebsocket() {
    if (!this.cachedWebsocket) {
      console.debug('🔌 Creating new WebSocket connection 🔄 getWebsocket');
      this.cachedWebsocket = await this.arc.tables.websocket();
    }
    return this.cachedWebsocket;
  }

  /**
   * Send a message to a specific user with retry
   * @param {string} connectionId - Connection ID to send to
   * @param {Object} message - Message to send
   * @param {Object} options - Options for sending
   * @param {number} options.retries - Number of retries (default: 1)
   * @returns {Promise<boolean>} - Success status
   */
  async sendToUser(connectionId, message, options = { retries: 1 }) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    let attempts = 0;
    
    console.debug('🔌 Sending message to user 📤 sendToUser', { 
      connectionId, 
      messageType: typeof message === 'object' ? message.type : 'string'
    });
    
    while (attempts <= options.retries) {
      try {
        const websocket = await this.getWebsocket();
        await websocket.send({ id: connectionId, payload });
        return true;
      } catch (err) {
        attempts++;
        
        // Only log on final attempt
        if (attempts > options.retries) {
          console.log('🔌 Failed to send message after retries 📛 sendToUser', {
            connectionId,
            error: err.message,
            attempts
          });
          
          this.logger.error(`Failed to send to ${connectionId} after ${options.retries + 1} attempts`, {
            error: err.message,
            code: err.code,
            connectionId
          });
          return false;
        }
        
        console.debug('🔌 Retrying send message 🔁 sendToUser', { connectionId, attempt: attempts });
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts - 1)));
      }
    }
  }

  /**
   * Broadcast a message to all connections except excluded ones
   * @param {Object} message - Message to broadcast
   * @param {string[]} excludeConnections - Connection IDs to exclude
   * @param {Object} options - Broadcast options
   * @param {boolean} options.batchProcessing - Use batch processing (default: true)
   * @returns {Promise<{success: number, failed: number}>} - Success/failure counts
   */
  async broadcastMessage(message, excludeConnections = [], options = { batchProcessing: true }) {
    const tables = await this.arc.tables();
    const websocket = await this.getWebsocket();
    
    // Get all active connections
    const result = await tables.users.scan({
      ProjectionExpression: 'userId, connectionId'  // Only get what we need
    });
    
    if (!result.Items || result.Items.length === 0) {
      console.debug('🔌 No active users for broadcast 👻 broadcastMessage');
      return { success: 0, failed: 0 };
    }
    
    // Convert to Set for O(1) lookups
    const excludeSet = new Set(excludeConnections);
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    const eligibleUsers = result.Items.filter(user => 
      user.connectionId && !excludeSet.has(user.connectionId)
    );
    
    console.log('🔌 Broadcasting message to users 📢 broadcastMessage', { 
      messageType: typeof message === 'object' ? message.type : 'string',
      recipientCount: eligibleUsers.length,
      excludedCount: excludeConnections.length
    });
    
    // Tracking results
    let successCount = 0;
    let failureCount = 0;
    
    // For batch processing
    if (options.batchProcessing) {
      // Process in batches of 25 for better performance
      const batchSize = 25;
      const eligibleConnections = eligibleUsers.map(user => user.connectionId);
      
      for (let i = 0; i < eligibleConnections.length; i += batchSize) {
        const batch = eligibleConnections.slice(i, i + batchSize);
        console.debug('🔌 Processing broadcast batch 🧮 broadcastMessage', { 
          batchSize: batch.length, 
          batchNumber: Math.floor(i / batchSize) + 1 
        });
        
        const batchPromises = batch.map(connectionId => 
          this.sendToUser(connectionId, messageString)
            .then(success => success ? successCount++ : failureCount++)
            .catch(() => failureCount++)
        );
        
        await Promise.allSettled(batchPromises);
      }
    } else {
      // Traditional sequential processing
      for (const user of eligibleUsers) {
        try {
          await websocket.send({
            id: user.connectionId,
            payload: messageString
          });
          successCount++;
        } catch (err) {
          failureCount++;
          this.logger.warn(`Error sending to ${user.connectionId}`, {
            error: err.message,
            userId: user.userId
          });
        }
      }
    }
    
    console.log('🔌 Broadcast completed 📊 broadcastMessage', { 
      success: successCount, 
      failed: failureCount 
    });
    
    return { success: successCount, failed: failureCount };
  }
}

module.exports = WebSocketService;
