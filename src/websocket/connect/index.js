const { nanoid } = require('nanoid');
const { createHandler } = require('../handler-factory');

/**
 * Handle WebSocket connection
 */
async function handleConnect(event, container) {
  const { services: { userService }, logger } = container;
  const connectionId = event.requestContext.connectionId;
  
  // Generate a userId and create the user
  const userId = nanoid();
  console.log('🌐 New WebSocket connection established 🔗 handleConnect', {
    connectionId,
    userId
  });
  
  logger.info('Creating new user', { userId, connectionId });
  
  try {
    // Create new user
    const user = await userService.createUser(connectionId, userId);
    
    // Notify existing users about the new user
    await userService.notifyUserJoined(user);
    
    // Send existing users to the new user
    await userService.sendExistingUsersTo(user);
    
    console.log('🌐 User onboarding completed ✅ handleConnect', {
      userId,
      connectionId
    });
    
    return { statusCode: 200 };
  } catch (err) {
    console.log('🌐 Error handling connection ❌ handleConnect', {
      connectionId,
      error: err.message
    });
    logger.error('Error handling connection', err);
    return { statusCode: 500 };
  }
}

// Export the wrapped handler
exports.handler = createHandler(handleConnect);
