/**
 * WebSocket mock for testing
 */
class WebSocketMock {
  constructor() {
    this.connections = new Map();
  }

  connect(connectionId) {
    this.connections.set(connectionId, true);
    return Promise.resolve({ statusCode: 200 });
  }

  disconnect(connectionId) {
    this.connections.delete(connectionId);
    return Promise.resolve({ statusCode: 200 });
  }

  send(connectionId, message) {
    if (!this.connections.has(connectionId)) {
      return Promise.reject(new Error('Connection not found'));
    }
    return Promise.resolve({ statusCode: 200 });
  }

  getConnections() {
    return Array.from(this.connections.keys());
  }
}

export default WebSocketMock;
