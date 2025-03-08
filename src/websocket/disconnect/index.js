const { createHandler } = require('../handler-factory');

/**
 * Handle WebSocket disconnection
 */
async function handleDisconnect(event, container) {
  const { services: { userService }, logger } = container;
  const connectionId = event.requestContext.connectionId;
  
  console.log('🌐 WebSocket connection closing 🔒 handleDisconnect', { connectionId });
  logger.info('User disconnecting', { connectionId });
  
  try {
    // Handle user disconnection - this removes the user and notifies others
    const success = await userService.handleDisconnect(connectionId);
    
    if (!success) {
      console.log('🌐 No user found for connection when disconnecting ⚠️ handleDisconnect', { connectionId });
      logger.warn('No user found for connection when disconnecting', { connectionId });
    } else {
      console.log('🌐 User successfully disconnected 👋 handleDisconnect', { connectionId });
    }
    
    return { statusCode: 200 };
  } catch (err) {
    console.log('🌐 Error handling disconnection ❌ handleDisconnect', {
      connectionId,
      error: err.message
    });
    logger.error('Error handling disconnection', err);
    return { statusCode: 500 };
  }
}

// Export the wrapped handler
exports.handler = createHandler(handleDisconnect);
