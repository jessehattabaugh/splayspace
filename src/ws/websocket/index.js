import arc from '@architect/functions';

/**
 * WebSocket handler for explicit 'websocket' route
 * This is a compatibility route for AWS API Gateway WebSockets
 */
export async function handler(event) {
  console.log('WebSocket explicit route event:', event);
  
  // Get the WebSocket utilities
  const wss = await arc.tables.websocket();
  
  // Get the connection ID from the event
  const { connectionId } = event.requestContext;
  
  if (!connectionId) {
    console.error('No connectionId provided in event');
    return { statusCode: 400, body: 'Missing connectionId' };
  }
  
  try {
    // Just send a welcome message to confirm the connection works
    await wss.send(connectionId, JSON.stringify({
      type: 'WELCOME',
      message: 'Connected via explicit websocket route',
      timestamp: Date.now(),
      userId: connectionId // Temporary ID until proper registration
    }));
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error in WebSocket explicit route handler:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
