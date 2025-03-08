const { initializeContainer } = require('../infrastructure/di-container');

/**
 * Creates a WebSocket event handler with dependency injection
 * @param {Function} handlerFn - The handler implementation 
 * @returns {Function} AWS Lambda compatible handler
 */
function createHandler(handlerFn) {
  return async function(event) {
    let container;
    
    try {
      // Initialize all services
      container = await initializeContainer();
      const { logger } = container;
      
      // Log the incoming event (sanitize sensitive data)
      const sanitizedEvent = {
        ...event,
        headers: event.headers ? '...' : undefined,
        body: event.body ? '...' : undefined,
        requestContext: {
          ...event.requestContext,
          connectionId: event.requestContext?.connectionId
        }
      };
      
      logger.info('WebSocket event received', { 
        eventType: event.requestContext?.eventType,
        connectionId: event.requestContext?.connectionId
      });
      
      // Call the actual handler with dependencies
      return await handlerFn(event, container);
      
    } catch (error) {
      // Log error but don't expose internal details
      if (container?.logger) {
        container.logger.error('Error in WebSocket handler', error);
      } else {
        console.error('Error in WebSocket handler:', error);
      }
      
      return { 
        statusCode: 500, 
        body: 'Internal server error'
      };
    }
  };
}

module.exports = { createHandler };
