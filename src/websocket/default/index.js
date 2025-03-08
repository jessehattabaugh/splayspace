const arc = require('@architect/functions');
const { generateTerrain } = require('../../shared/terrain-generator');
const { getUserByConnectionId, broadcastMessage, getRandomResourceType, distance } = require('../../shared/utils');
const { createHandler } = require('../handler-factory');
const MessageHandlers = require('./message-handlers');
const RateLimiter = require('../../shared/RateLimiter');

// Create rate limiters with different settings for different operations
const messageLimiter = new RateLimiter({ maxRequests: 60, timeWindowMs: 60000 }); // 60 msgs per minute
const moveLimiter = new RateLimiter({ maxRequests: 600, timeWindowMs: 60000 }); // 600 moves per minute
const chunkLimiter = new RateLimiter({ maxRequests: 120, timeWindowMs: 60000 }); // 120 chunk requests per minute

/**
 * Handle WebSocket messages with improved error handling and rate limiting
 */
async function handleDefault(event, container) {
  const { 
    services: { userService, worldService, resourceService, chatService },
    logger 
  } = container;
  
  const connectionId = event.requestContext.connectionId;
  
  try {
    // Parse message with error handling
    let message;
    try {
      message = JSON.parse(event.body);
    } catch (err) {
      console.log('🌐 Invalid JSON received ⚠️ handleDefault', { connectionId });
      logger.warn('Invalid JSON received', { connectionId });
      return { statusCode: 400, body: 'Invalid JSON format' };
    }
    
    const { type, payload } = message;
    
    console.debug('🌐 Received WebSocket message 📩 handleDefault', { 
      type, 
      connectionId,
      payloadSize: payload ? JSON.stringify(payload).length : 0
    });
    
    // Apply appropriate rate limiter based on message type
    const limiter = 
      type === 'MOVE' ? moveLimiter : 
      type === 'GET_WORLD_CHUNK' ? chunkLimiter :
      messageLimiter;
      
    // Check rate limit
    if (!limiter.allowRequest(connectionId)) {
      console.log('🌐 Rate limit exceeded 🚦 handleDefault', { connectionId, type });
      logger.warn('Rate limit exceeded', { connectionId, type });
      return { 
        statusCode: 429, 
        body: 'Too many requests. Please slow down.' 
      };
    }
    
    logger.info('Message received', { type, connectionId });
    
    // Find user by connectionId
    const user = await userService.getUserByConnectionId(connectionId);
    
    if (!user) {
      console.log('🌐 User not found for connection 🔍 handleDefault', { connectionId, type });
      logger.warn('User not found for connection', { connectionId });
      return { statusCode: 401, body: 'User not authenticated' };
    }
    
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      console.log('🌐 Invalid payload received 📤 handleDefault', { connectionId, type });
      logger.warn('Invalid payload', { connectionId, type });
      return { statusCode: 400, body: 'Invalid payload' };
    }
    
    // Initialize message handlers with services
    const handlers = new MessageHandlers({
      userService,
      worldService,
      resourceService,
      chatService,
      logger
    });
    
    // Get the appropriate handler for this message type
    const handlerFn = handlers.getHandlerForType(type);
    
    if (!handlerFn) {
      console.log('🌐 Unknown message type received ❓ handleDefault', { 
        type, 
        connectionId, 
        userId: user.userId 
      });
      logger.warn('Unknown message type', { type, connectionId });
      return { statusCode: 400, body: `Unknown message type: ${type}` };
    }
    
    // Process the message with timing metric
    const startTime = Date.now();
    const result = await handlerFn(user, payload);
    const processingTime = Date.now() - startTime;
    
    // Log processing time for performance monitoring
    if (processingTime > 200) { // Log slow operations
      console.log('🌐 Slow message processing detected ⏱️ handleDefault', { 
        type, 
        connectionId, 
        userId: user.userId,
        processingTimeMs: processingTime 
      });
      
      logger.warn('Slow message processing', { 
        type, 
        connectionId, 
        processingTimeMs: processingTime 
      });
    } else {
      console.debug('🌐 Message processed successfully ✅ handleDefault', { 
        type, 
        connectionId,
        processingTimeMs: processingTime 
      });
      
      logger.debug('Message processed', { 
        type, 
        connectionId, 
        processingTimeMs: processingTime 
      });
    }
    
    return { 
      statusCode: 200,
      body: result ? JSON.stringify(result) : ''
    };
  } catch (err) {
    console.log('🌐 Error processing message ❌ handleDefault', {
      connectionId,
      error: err.message,
      stack: err.stack
    });
    
    logger.error('Error processing message', {
      connectionId,
      error: err.message,
      stack: err.stack
    });
    
    return { 
      statusCode: 500,
      body: 'Internal server error processing message'
    };
  }
}

// Export the wrapped handler
exports.handler = createHandler(handleDefault);

// Message handlers with focused responsibilities
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
  const moveMessage = JSON.stringify({
    type: 'USER_MOVED',
    userId: user.userId,
    position: { x, y }
  });
  
  await broadcastMessage(tables, moveMessage, [user.connectionId]);
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
  
  // Send chunk data to requesting user
  const websocket = await arc.tables.websocket();
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
  const chatMessage = JSON.stringify({
    type: 'CHAT_MESSAGE',
    userId: user.userId,
    message,
    timestamp: Date.now()
  });
  
  // Send message to all users including sender
  await broadcastMessage(tables, chatMessage);
}

async function handleCollectResource(tables, user, { resourceId }) {
  // Get the resource
  const resource = await tables.resources.get({ resourceId });
  
  if (!resource) return;
  
  // Add to user inventory
  await tables.users.update({
    Key: { userId: user.userId },
    UpdateExpression: 'set inventory = list_append(if_not_exists(inventory, :empty_list), :resource)',
    ExpressionAttributeValues: {
      ':empty_list': [],
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
  
  const artResource = {
    resourceId,
    type: 'art',
    creator: user.userId,
    position,
    data: art,
    createdAt: Date.now()
  };
  
  await tables.resources.put(artResource);
  
  // Notify nearby users about the new art (within 100 units)
  const nearbyUserMessage = JSON.stringify({
    type: 'NEW_ART_CREATED',
    resourceId,
    creator: user.userId,
    position,
    data: art
  });
  
  // Get all users
  const result = await tables.users.scan({});
  if (!result.Items) return;
  
  // Find nearby users
  const websocket = await arc.tables.websocket();
  const visibilityRange = 100; // Units
  
  for (const nearbyUser of result.Items) {
    if (distance(nearbyUser.position, position) < visibilityRange) {
      try {
        await websocket.send({
          id: nearbyUser.connectionId,
          payload: nearbyUserMessage
        });
      } catch (err) {
        console.log(`Error sending to ${nearbyUser.connectionId}`, err);
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
