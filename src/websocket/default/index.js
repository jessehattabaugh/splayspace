const arc = require('@architect/functions');
const { generateTerrain } = require('../../shared/terrain-generator');

/**
 * Handle WebSocket messages
 */
exports.handler = async function ws(event) {
  const tables = await arc.tables();
  const connectionId = event.requestContext.connectionId;
  
  try {
    const message = JSON.parse(event.body);
    const { type, payload } = message;
    
    // Find user by connectionId
    const user = await getUserByConnectionId(tables, connectionId);
    
    if (!user) {
      return { statusCode: 400, body: 'User not found' };
    }
    
    switch (type) {
      case 'MOVE':
        await handleMove(tables, user, payload);
        break;
      case 'GET_WORLD_CHUNK':
        await handleGetWorldChunk(tables, user, payload);
        break;
      case 'CHAT_MESSAGE':
        await handleChatMessage(tables, user, payload);
        break;
      case 'COLLECT_RESOURCE':
        await handleCollectResource(tables, user, payload);
        break;
      case 'CREATE_ART':
        await handleCreateArt(tables, user, payload);
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
    
    return { statusCode: 200 };
  } catch (err) {
    console.log('Error processing message', err);
    return { statusCode: 500 };
  }
};

async function getUserByConnectionId(tables, connectionId) {
  const result = await tables.users.scan({
    FilterExpression: 'connectionId = :connectionId',
    ExpressionAttributeValues: { ':connectionId': connectionId }
  });
  
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function handleMove(tables, user, { x, y }) {
  // Update user position
  await tables.users.update({
    Key: { userId: user.userId },
    UpdateExpression: 'set position.x = :x, position.y = :y, lastActive = :now',
    ExpressionAttributeValues: {
      ':x': x,
      ':y': y,
      ':now': Date.now()
    }
  });
  
  // Broadcast movement to other users
  const websocket = await arc.tables.websocket();
  const result = await tables.users.scan({});
  
  if (!result.Items) return;
  
  const message = JSON.stringify({
    type: 'USER_MOVED',
    userId: user.userId,
    position: { x, y }
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

async function handleGetWorldChunk(tables, user, { chunkX, chunkY }) {
  // Check if chunk exists in DB, otherwise generate it
  const chunkId = `${chunkX}:${chunkY}`;
  let chunk = await tables.worlds.get({ worldId: chunkId });
  
  if (!chunk) {
    // Generate new terrain chunk
    const terrain = generateTerrain(chunkX, chunkY);
    chunk = {
      worldId: chunkId,
      terrain,
      resources: generateResourcesForChunk(chunkX, chunkY),
      createdAt: Date.now()
    };
    
    await tables.worlds.put(chunk);
  }
  
  const websocket = await arc.tables.websocket();
  
  // Send chunk data to requesting user
  try {
    await websocket.send({
      id: user.connectionId,
      payload: JSON.stringify({
        type: 'WORLD_CHUNK_DATA',
        chunkX,
        chunkY,
        data: chunk
      })
    });
  } catch (err) {
    console.log(`Error sending chunk data to ${user.connectionId}`, err);
  }
}

async function handleChatMessage(tables, user, { message }) {
  const websocket = await arc.tables.websocket();
  const result = await tables.users.scan({});
  
  if (!result.Items) return;
  
  const chatMessage = JSON.stringify({
    type: 'CHAT_MESSAGE',
    userId: user.userId,
    message,
    timestamp: Date.now()
  });
  
  // Send message to all connected users
  for (const item of result.Items) {
    try {
      await websocket.send({
        id: item.connectionId,
        payload: chatMessage
      });
    } catch (err) {
      console.log(`Error sending to ${item.connectionId}`, err);
    }
  }
}

async function handleCollectResource(tables, user, { resourceId }) {
  // Get the resource
  const resource = await tables.resources.get({ resourceId });
  
  if (!resource) return;
  
  // Add to user inventory
  await tables.users.update({
    Key: { userId: user.userId },
    UpdateExpression: 'set inventory = list_append(inventory, :resource)',
    ExpressionAttributeValues: {
      ':resource': [resource]
    }
  });
  
  // Remove resource from world
  await tables.resources.delete({ resourceId });
  
  // Notify user of successful collection
  const websocket = await arc.tables.websocket();
  
  try {
    await websocket.send({
      id: user.connectionId,
      payload: JSON.stringify({
        type: 'RESOURCE_COLLECTED',
        resourceId,
        resource
      })
    });
  } catch (err) {
    console.log(`Error sending to ${user.connectionId}`, err);
  }
}

async function handleCreateArt(tables, user, { art, position }) {
  // Save the art as a special type of resource
  const resourceId = `art:${user.userId}:${Date.now()}`;
  
  await tables.resources.put({
    resourceId,
    type: 'art',
    creator: user.userId,
    position,
    data: art,
    createdAt: Date.now()
  });
  
  // Notify nearby users about the new art
  const websocket = await arc.tables.websocket();
  const result = await tables.users.scan({});
  
  if (!result.Items) return;
  
  const message = JSON.stringify({
    type: 'NEW_ART_CREATED',
    resourceId,
    creator: user.userId,
    position,
    data: art
  });
  
  for (const item of result.Items) {
    // Calculate if user is nearby to see the art (simple distance check)
    const userPos = item.position || { x: 0, y: 0 };
    const distance = Math.sqrt(
      Math.pow(userPos.x - position.x, 2) + 
      Math.pow(userPos.y - position.y, 2)
    );
    
    if (distance < 100) { // visible within 100 units
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

function generateResourcesForChunk(chunkX, chunkY) {
  const resources = [];
  const chunkSize = 100;
  const baseX = chunkX * chunkSize;
  const baseY = chunkY * chunkSize;
  
  // Generate between 0-5 resources per chunk
  const numResources = Math.floor(Math.random() * 6);
  
  for (let i = 0; i < numResources; i++) {
    const x = baseX + Math.floor(Math.random() * chunkSize);
    const y = baseY + Math.floor(Math.random() * chunkSize);
    
    resources.push({
      id: `res:${chunkX}:${chunkY}:${i}`,
      type: getRandomResourceType(),
      position: { x, y },
      quantity: Math.floor(Math.random() * 10) + 1
    });
  }
  
  return resources;
}

function getRandomResourceType() {
  const types = ['stone', 'wood', 'metal', 'crystal', 'fabric'];
  return types[Math.floor(Math.random() * types.length)];
}
