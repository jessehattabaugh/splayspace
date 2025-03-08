import arc from '@architect/functions';

/**
 * WebSocket disconnect handler
 * Called when a client disconnects from the WebSocket endpoint
 */
export async function handler(event) {
  try {
    console.log('WebSocket disconnect event:', event);
    
    // Get the connection ID from the event
    const { connectionId } = event.requestContext;
    
    if (!connectionId) {
      console.error('No connectionId provided in event');
      return { statusCode: 400, body: 'Missing connectionId' };
    }
    
    // Get DynamoDB tables
    const db = await arc.tables();
    
    // Find user by connection ID
    const users = await db.users.scan({
      FilterExpression: 'connectionId = :connectionId',
      ExpressionAttributeValues: {
        ':connectionId': connectionId
      }
    });
    
    // If no user found, return success (nothing to clean up)
    if (!users.Items || users.Items.length === 0) {
      console.log(`No user found for connectionId ${connectionId}`);
      return { statusCode: 200 };
    }
    
    // Get the user to disconnect
    const user = users.Items[0];
    
    // Delete the user from the database
    await db.users.delete({ id: user.id });
    
    // Get the WebSocket utilities
    const wss = await arc.tables.websocket();
    
    // Notify other users about the disconnection
    const remainingUsers = await db.users.scan();
    
    for (const otherUser of remainingUsers.Items || []) {
      try {
        await wss.send(otherUser.connectionId, JSON.stringify({
          type: 'USER_LEFT',
          userId: user.id
        }));
      } catch (error) {
        console.error(`Failed to notify user ${otherUser.id} about user leaving:`, error);
      }
    }
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error in WebSocket disconnect handler:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
