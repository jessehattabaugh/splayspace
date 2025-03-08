import arc from '@architect/functions';
import { generateTerrain } from '../../shared/terrain-generator';

/**
 * WebSocket default handler
 * Called when a message is received from a client
 */
export async function handler(event) {
  try {
    // Parse message body
    let message;
    try {
      message = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON message' })
      };
    }

    // Get the connection ID from the event
    const { connectionId } = event.requestContext;
    
    if (!connectionId) {
      return { statusCode: 400, body: 'Missing connectionId' };
    }
    
    // Validate message has type
    if (!message.type || typeof message.type !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message must have a valid type' })
      };
    }

    // Handle different message types
    switch (message.type) {
      case 'MOVE':
        return await handleMove(event, message);
      case 'CHAT':
        return await handleChat(event, message);
      case 'REQUEST_CHUNK':
        return await handleRequestChunk(event, message);
      case 'COLLECT_RESOURCE':
        return await handleCollectResource(event, message);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown message type: ${message.type}` })
        };
    }
  } catch (error) {
    console.error('Error in default handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

/**
 * Handle MOVE message
 */
async function handleMove(event, message) {
  const { connectionId } = event.requestContext;
  const { payload } = message;

  // Validate payload
  if (!payload || typeof payload.x !== 'number' || typeof payload.y !== 'number') {
    return { statusCode: 400, body: 'Invalid move payload' };
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
  
  // If no user found, return error
  if (!users.Items || users.Items.length === 0) {
    console.error(`No user found for connectionId ${connectionId}`);
    return { statusCode: 403, body: 'User not found' };
  }
  
  // Get the user
  const user = users.Items[0];
  
  // Calculate new position
  const newPosition = {
    x: user.position.x + payload.x,
    y: user.position.y + payload.y
  };
  
  // Update user position
  await db.users.update({
    Key: { id: user.id },
    UpdateExpression: 'SET position = :position',
    ExpressionAttributeValues: {
      ':position': newPosition
    }
  });
  
  // Get the WebSocket utilities
  const wss = await arc.tables.websocket();
  
  // Send confirmation to the user
  await wss.send(user.connectionId, JSON.stringify({
    type: 'MOVE_CONFIRMED',
    position: newPosition
  }));
  
  // Notify other users about the move
  const otherUsers = await db.users.scan({
    FilterExpression: 'id <> :userId',
    ExpressionAttributeValues: {
      ':userId': user.id
    }
  });
  
  for (const otherUser of otherUsers.Items || []) {
    try {
      await wss.send(otherUser.connectionId, JSON.stringify({
        type: 'USER_MOVED',
        userId: user.id,
        position: newPosition
      }));
    } catch (error) {
      console.error(`Failed to notify user ${otherUser.id} about user movement:`, error);
    }
  }
  
  return { statusCode: 200 };
}

/**
 * Handle CHAT message
 */
async function handleChat(event, message) {
  const { connectionId } = event.requestContext;
  const { payload } = message;

  // Validate payload
  if (!payload || !payload.message) {
    return { statusCode: 400, body: 'Invalid chat payload' };
  }
  
  const chatMessage = payload.message.trim();
  
  // Ignore empty messages
  if (!chatMessage) {
    return { statusCode: 400, body: 'Empty message' };
  }
  
  // Limit message length
  const truncatedMessage = chatMessage.length > 1000 ? 
    chatMessage.substring(0, 997) + '...' : chatMessage;
  
  // Get DynamoDB tables
  const db = await arc.tables();
  
  // Find user by connection ID
  const users = await db.users.scan({
    FilterExpression: 'connectionId = :connectionId',
    ExpressionAttributeValues: {
      ':connectionId': connectionId
    }
  });
  
  // If no user found, return error
  if (!users.Items || users.Items.length === 0) {
    console.error(`No user found for connectionId ${connectionId}`);
    return { statusCode: 403, body: 'User not found' };
  }
  
  // Get the user
  const user = users.Items[0];
  
  // Create chat message
  const chatPayload = {
    type: 'CHAT',
    userId: user.id,
    username: user.username || user.id,
    message: truncatedMessage,
    timestamp: Date.now()
  };
  
  // Get the WebSocket utilities
  const wss = await arc.tables.websocket();
  
  // Send to all users
  const allUsers = await db.users.scan();
  
  for (const recipient of allUsers.Items || []) {
    try {
      await wss.send(recipient.connectionId, JSON.stringify(chatPayload));
    } catch (error) {
      console.error(`Failed to send chat message to user ${recipient.id}:`, error);
    }
  }
  
  return { statusCode: 200 };
}

/**
 * Handle REQUEST_CHUNK message
 */
async function handleRequestChunk(event, message) {
  const { connectionId } = event.requestContext;
  const { payload } = message;

  // Validate payload
  if (!payload || typeof payload.chunkX !== 'number' || typeof payload.chunkY !== 'number') {
    return { statusCode: 400, body: 'Invalid chunk request payload' };
  }
  
  const { chunkX, chunkY } = payload;
  
  // Get DynamoDB tables
  const db = await arc.tables();
  
  // Check if chunk exists in database
  const worldKey = `chunk_${chunkX}_${chunkY}`;
  
  let chunk = await db.worlds.get({ id: worldKey });
  
  // If chunk doesn't exist, generate it
  if (!chunk) {
    // Generate chunk with terrain generator
    const terrain = generateTerrain(chunkX, chunkY, 100);
    
    // Store chunk in database
    await db.worlds.put({
      id: worldKey,
      chunkX,
      chunkY,
      terrain,
      createdAt: Date.now()
    });
    
    chunk = { id: worldKey, chunkX, chunkY, terrain };
  }
  
  // Get the WebSocket utilities
  const wss = await arc.tables.websocket();
  
  // Send chunk data to user
  await wss.send(connectionId, JSON.stringify({
    type: 'CHUNK_DATA',
    chunkX,
    chunkY,
    data: chunk.terrain
  }));
  
  return { statusCode: 200 };
}

/**
 * Handle COLLECT_RESOURCE message
 */
async function handleCollectResource(event, message) {
  const { connectionId } = event.requestContext;
  const { payload } = message;

  // Validate payload
  if (!payload || !payload.resourceId || !payload.position) {
    return { statusCode: 400, body: 'Invalid resource collection payload' };
  }
  
  const { resourceId, position } = payload;
  
  // Get DynamoDB tables
  const db = await arc.tables();
  
  // Check if resource exists
  const resource = await db.resources.get({ id: resourceId });
  
  if (!resource) {
    const wss = await arc.tables.websocket();
    await wss.send(connectionId, JSON.stringify({
      type: 'RESOURCE_ERROR',
      message: 'Resource not found'
    }));
    return { statusCode: 404, body: 'Resource not found' };
  }
  
  // Find user by connection ID
  const users = await db.users.scan({
    FilterExpression: 'connectionId = :connectionId',
    ExpressionAttributeValues: {
      ':connectionId': connectionId
    }
  });
  
  // If no user found, return error
  if (!users.Items || users.Items.length === 0) {
    console.error(`No user found for connectionId ${connectionId}`);
    return { statusCode: 403, body: 'User not found' };
  }
  
  // Get the user
  const user = users.Items[0];
  
  // Add resource to user's inventory
  // (In a real implementation, you'd have a more sophisticated inventory system)
  await db.users.update({
    Key: { id: user.id },
    UpdateExpression: 'SET inventory = list_append(if_not_exists(inventory, :empty_list), :resource)',
    ExpressionAttributeValues: {
      ':empty_list': [],
      ':resource': [{ id: resourceId, type: resource.type }]
    }
  });
  
  // Delete the resource from the world
  await db.resources.delete({ id: resourceId });
  
  // Get the WebSocket utilities
  const wss = await arc.tables.websocket();
  
  // Notify the user of successful collection
  await wss.send(connectionId, JSON.stringify({
    type: 'RESOURCE_COLLECTED',
    resourceId,
    resourceType: resource.type
  }));
  
  // Notify other users that the resource is gone
  const otherUsers = await db.users.scan({
    FilterExpression: 'id <> :userId',
    ExpressionAttributeValues: {
      ':userId': user.id
    }
  });
  
  for (const otherUser of otherUsers.Items || []) {
    try {
      await wss.send(otherUser.connectionId, JSON.stringify({
        type: 'RESOURCE_COLLECTED',
        resourceId,
        userId: user.id,
        position
      }));
    } catch (error) {
      console.error(`Failed to notify user ${otherUser.id} about resource collection:`, error);
    }
  }
  
  return { statusCode: 200 };
}
