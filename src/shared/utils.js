/**
 * Shared utility functions used across server components
 */
const arc = require('@architect/functions');

/**
 * Broadcast a message to multiple users
 * @param {Object} tables - DynamoDB tables
 * @param {string} message - Message to send as JSON string
 * @param {string[]} excludeIds - Connection IDs to exclude
 */
async function broadcastMessage(tables, message, excludeIds = []) {
  const websocket = await arc.tables.websocket();
  const result = await tables.users.scan({});
  
  if (!result.Items || result.Items.length === 0) return;
  
  const excludeSet = new Set(excludeIds);
  
  for (const item of result.Items) {
    if (!excludeSet.has(item.connectionId)) {
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

/**
 * Find a user by connection ID
 * @param {Object} tables - DynamoDB tables
 * @param {string} connectionId - WebSocket connection ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByConnectionId(tables, connectionId) {
  const result = await tables.users.scan({
    FilterExpression: 'connectionId = :connectionId',
    ExpressionAttributeValues: { ':connectionId': connectionId }
  });
  
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

/**
 * Calculate distance between two positions
 * @param {Object} pos1 - Position with x,y properties
 * @param {Object} pos2 - Position with x,y properties
 * @returns {number} Distance between positions
 */
function distance(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + 
    Math.pow(pos1.y - pos2.y, 2)
  );
}

/**
 * Generate a random color
 * @returns {string} Color name
 */
function getRandomColor() {
  const colors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a random resource type
 * @returns {string} Resource type
 */
function getRandomResourceType() {
  const types = ['stone', 'wood', 'metal', 'crystal', 'fabric'];
  return types[Math.floor(Math.random() * types.length)];
}

module.exports = {
  broadcastMessage,
  getUserByConnectionId,
  distance,
  getRandomColor,
  getRandomResourceType
};
