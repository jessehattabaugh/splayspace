/**
 * WebSocket mock for testing
 */
class WebSocketMock {
  constructor() {
    this.messages = [];
    this.clients = new Map();
    this.messageHandlers = new Map();
  }
  
  /**
   * Register a client
   * @param {string} id - Connection ID
   * @param {Function} messageHandler - Handler for incoming messages
   */
  registerClient(id, messageHandler) {
    this.clients.set(id, {
      id,
      send: (message) => {
        this.messages.push({
          to: id,
          message: typeof message === 'string' ? message : JSON.stringify(message)
        });
        
        if (messageHandler) {
          messageHandler(message);
        }
      }
    });
  }
  
  /**
   * Remove a client
   * @param {string} id - Connection ID
   */
  removeClient(id) {
    this.clients.delete(id);
  }
  
  /**
   * Send a message to a client
   * @param {Object} params - Message parameters
   * @param {string} params.id - Client ID
   * @param {string|Object} params.payload - Message payload
   */
  send({ id, payload }) {
    const client = this.clients.get(id);
    if (!client) {
      throw new Error(`Client ${id} not found`);
    }
    
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    client.send(message);
    
    return Promise.resolve();
  }
  
  /**
   * Register a message handler for a specific action
   * @param {string} action - Action type
   * @param {Function} handler - Handler function
   */
  onMessage(action, handler) {
    this.messageHandlers.set(action, handler);
  }
  
  /**
   * Process an incoming message
   * @param {string} connectionId - Connection ID
   * @param {Object} message - Message object
   */
  processMessage(connectionId, message) {
    const handler = this.messageHandlers.get(message.type || message.action);
    if (handler) {
      handler({ connectionId, message });
    }
  }
  
  /**
   * Reset the mock state
   */
  reset() {
    this.messages = [];
    this.clients.clear();
    this.messageHandlers.clear();
  }
}

export default WebSocketMock;
