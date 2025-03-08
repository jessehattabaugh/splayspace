import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nanoid } from 'nanoid';
import WebSocketMock from '../utils/websocket-mock';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'local';

// Set WebSocket API ID for testing
process.env.WEBSOCKET_API_ID = 'test-api-id';

// Create a global WebSocketMock instance so it can be used across the test
const websocketMock = new WebSocketMock();

// Mock the arc.tables.websocket function
vi.mock('@architect/functions', () => {
  return {
    tables: vi.fn().mockResolvedValue({
      users: {
        put: vi.fn().mockResolvedValue({}),
        scan: vi.fn().mockResolvedValue({ Items: [] }),
        delete: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({})
      },
      worlds: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue({})
      },
      resources: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({})
      }
    }),
    tables: {
      websocket: vi.fn().mockReturnValue(websocketMock)
    }
  };
});

// Mock AWS services
vi.mock('@aws-lite/client', () => ({
  default: () => ({
    SSM: {
      GetParametersByPath: vi.fn().mockResolvedValue({ Parameters: [] })
    }
  })
}));

// Import the WebSocket handlers - update paths to match your project structure
import { handler as connectHandler } from '../../src/ws/connect';
import { handler as disconnectHandler } from '../../src/ws/disconnect';
import { handler as defaultHandler } from '../../src/ws/default';

describe('WebSocket Flow', () => {
  let connectionId;
  let requestContext;
  
  beforeEach(() => {
    connectionId = nanoid();
    requestContext = { connectionId };
    // Reset the mock before each test
    vi.clearAllMocks();
  });
  
  it('should handle a complete connection lifecycle', async () => {
    // User connects
    const connectResponse = await connectHandler({ 
      requestContext: { connectionId: 'test-connection-1' } 
    });
    expect(connectResponse.statusCode).toBe(200);
    
    // User moves
    const moveResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'MOVE',
        payload: { x: 10, y: 20 }
      })
    });
    expect(moveResponse.statusCode).toBe(200);
    
    // User disconnects
    const disconnectResponse = await disconnectHandler({ requestContext });
    expect(disconnectResponse.statusCode).toBe(200);
  });
  
  it('should handle chat messages', async () => {
    // User connects
    await connectHandler({ requestContext });
    
    // User sends a chat message
    const chatResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'CHAT',
        payload: { message: 'Hello, world!' }
      })
    });
    
    expect(chatResponse.statusCode).toBe(200);
    expect(websocketMock.send).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('CHAT')
    );
  });
  
  it('should handle resource collection', async () => {
    // User connects
    await connectHandler({ requestContext });
    
    // User collects a resource
    const collectResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'COLLECT_RESOURCE',
        payload: { resourceId: 'resource-123', position: { x: 15, y: 25 } }
      })
    });
    
    expect(collectResponse.statusCode).toBe(200);
  });
  
  it('should handle world chunk requests', async () => {
    // User connects
    await connectHandler({ requestContext });
    
    // User requests a world chunk
    const chunkResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'REQUEST_CHUNK',
        payload: { chunkX: 0, chunkY: 0 }
      })
    });
    
    expect(chunkResponse.statusCode).toBe(200);
  });
  
  it('should handle invalid messages gracefully', async () => {
    // User connects
    await connectHandler({ requestContext });
    
    // User sends an invalid message
    const invalidResponse = await defaultHandler({
      requestContext,
      body: 'Not valid JSON'
    });
    
    expect(invalidResponse.statusCode).toBe(400);
    
    // User sends unknown message type
    const unknownTypeResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'UNKNOWN_TYPE',
        payload: {}
      })
    });
    
    expect(unknownTypeResponse.statusCode).toBe(400);
  });

  it('should handle invalid messages gracefully', async () => {
    // User connects
    await connectHandler({ requestContext });
    
    // Send message with unknown type
    const unknownTypeResponse = await defaultHandler({
      requestContext,
      body: JSON.stringify({
        type: 'UNKNOWN_TYPE',
        payload: {}
      })
    });
    
    expect(unknownTypeResponse.statusCode).toBe(400);
    
    // Send malformed JSON
    const malformedResponse = await defaultHandler({
      requestContext,
      body: 'not json'
    });
    
    expect(malformedResponse.statusCode).toBe(400);
  });
});
