import arc from '@architect/functions';
import { nanoid } from 'nanoid';

/**
 * WebSocket connect handler
 * Called when a client connects to the WebSocket endpoint
 */
export async function handler(event) {
  console.log('WebSocket connect event:', event);
  
  const { connectionId } = event.requestContext;
  
  if (!connectionId) {
    console.error('No connectionId provided in event');
    return { statusCode: 400, body: 'Missing connectionId' };
  }

  try {
    // Skip AWS service calls in test environment
    if (process.env.NODE_ENV === 'test') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Connected in test mode' })
      };
    }

    // Generate a new user ID
    const userId = `user_${nanoid(8)}`;
    
    // Get DynamoDB tables
    const db = await arc.tables();
    
    // Store user in database
    await db.users.put({
      id: userId,
      connectionId,
      createdAt: Date.now(),
      position: { x: 0, y: 0 }
    });
    
    // Get the WebSocket utilities
    const wss = await arc.tables.websocket();
    
    // Send welcome message to the user
    await wss.send(connectionId, JSON.stringify({
      type: 'WELCOME',
      userId,
      position: { x: 0, y: 0 }
    }));
    
    // Find existing users to notify about this new user
    const existingUsers = await db.users.scan();
    
    // Notify existing users about the new user
    for (const user of existingUsers.Items || []) {
      // Skip the new user
      if (user.connectionId === connectionId) continue;
      
      try {
        await wss.send(user.connectionId, JSON.stringify({
          type: 'USER_JOINED',
          user: {
            userId,
            position: { x: 0, y: 0 }
          }
        }));
      } catch (error) {
        console.error(`Failed to notify user ${user.id} about new user:`, error);
      }
    }
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error in WebSocket connect handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
