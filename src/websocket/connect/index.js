const arc = require('@architect/functions');
const { nanoid } = require('nanoid');

/**
 * Handle WebSocket connection
 */
exports.handler = async function ws(event) {
  const tables = await arc.tables();
  const connectionId = event.requestContext.connectionId;
  
  // Generate a default user
  const userId = nanoid();
  const defaultUser = {
    userId,
    connectionId,
    position: { x: 0, y: 0 },
    lastActive: Date.now(),
    color: getRandomColor(),
    inventory: []
  };
  
  // Store user connection in DynamoDB
  await tables.users.put(defaultUser);
  
  // Notify others about new user
  await notifyUsers(tables, defaultUser, connectionId);
  
  return { statusCode: 200 };
};

// Helper to generate random color for user
function getRandomColor() {
  const colors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Notify other users about a new connection
async function notifyUsers(tables, user, excludeConnectionId) {
  const websocket = await arc.tables.websocket();
  
  // Get all active connections
  const result = await tables.users.scan({});
  
  if (!result.Items || result.Items.length === 0) return;
  
  // Send to each connection except the new one
  const message = JSON.stringify({
    type: 'USER_JOINED',
    user: {
      userId: user.userId,
      position: user.position,
      color: user.color
    }
  });
  
  for (const item of result.Items) {
    if (item.connectionId !== excludeConnectionId) {
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
