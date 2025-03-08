const arc = require('@architect/functions');

/**
 * Handle WebSocket disconnection
 */
exports.handler = async function ws(event) {
  const tables = await arc.tables();
  const connectionId = event.requestContext.connectionId;
  
  // Find user by connectionId
  const result = await tables.users.scan({
    FilterExpression: 'connectionId = :connectionId',
    ExpressionAttributeValues: { ':connectionId': connectionId }
  });
  
  if (result.Items && result.Items.length > 0) {
    const user = result.Items[0];
    
    // Notify others about user leaving
    await notifyUserLeft(tables, user);
    
    // Remove user from database
    await tables.users.delete({ userId: user.userId });
  }
  
  return { statusCode: 200 };
};

async function notifyUserLeft(tables, user) {
  const websocket = await arc.tables.websocket();
  
  // Get all active connections
  const result = await tables.users.scan({});
  
  if (!result.Items || result.Items.length === 0) return;
  
  // Send to each connection except the one leaving
  const message = JSON.stringify({
    type: 'USER_LEFT',
    userId: user.userId
  });
  
  for (const item of result.Items) {
    if (item.connectionId !== user.connectionId) {
      try {
        await websocket.send({
          id: item.connectionId,
          payload: message
        });
      } catch (err) {
        console.log(`Error sending to ${item.connectionId}`, err);
      }
    }
  }
}
