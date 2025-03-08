import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nanoid } from 'nanoid';
import WebSocketMock from '../utils/websocket-mock';

// Mock the arc.tables.websocket function
vi.mock('@architect/functions', () => {
  const websocketMock = new WebSocketMock();
  
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
      websocket: vi.fn().mockResolvedValue(websocketMock)
    }
  };
});

// Import the WebSocket handlers 
import { handler as connectHandler } from '../../src/websocket/connect/index';
import { handler as disconnectHandler } from '../../src/websocket/disconnect/index';
import { handler as defaultHandler } from '../../src/websocket/default/index';

describe('WebSocket Flow', () => {
  let connectionId;
  let requestContext;
  
  beforeEach(() => {
    connectionId = nanoid();
    requestContext = { connectionId };
  });
  
  it('should handle a complete connection lifecycle', async () => {
    // User connects
    const connectResponse = await connectHandler({ requestContext });
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
});
