/**
 * Dependency Injection container to manage service initialization
 */
const arc = require('@architect/functions');
const WebSocketService = require('./WebSocketService');
const UserRepository = require('./repositories/UserRepository');
const WorldRepository = require('./repositories/WorldRepository');
const ResourceRepository = require('./repositories/ResourceRepository');
const UserService = require('../services/UserService');
const WorldService = require('../services/WorldService');
const ResourceService = require('../services/ResourceService');
const ChatService = require('../services/ChatService');
const Logger = require('../shared/Logger');

/**
 * Initializes all services with their dependencies
 * @returns {Promise<Object>} Container with all services
 */
async function initializeContainer() {
  // Initialize logger first for consistent logging
  const logger = new Logger();
  
  try {
    // Get DynamoDB tables
    const tables = await arc.tables();
    
    // Initialize core infrastructure services
    const messagingService = new WebSocketService(arc);
    
    // Initialize repositories
    const userRepository = new UserRepository(tables);
    const worldRepository = new WorldRepository(tables);
    const resourceRepository = new ResourceRepository(tables);
    
    // Initialize domain services
    const userService = new UserService(userRepository, messagingService, logger);
    const worldService = new WorldService(worldRepository, messagingService, logger);
    const resourceService = new ResourceService(
      resourceRepository, 
      userRepository, 
      messagingService,
      logger
    );
    const chatService = new ChatService(messagingService, logger);
    
    // Return container with all services
    return {
      tables,
      logger,
      repositories: {
        userRepository,
        worldRepository,
        resourceRepository
      },
      services: {
        userService,
        worldService,
        resourceService,
        chatService,
        messagingService
      }
    };
  } catch (error) {
    logger.error('Failed to initialize container', error);
    throw new Error('Failed to initialize application: ' + error.message);
  }
}

module.exports = { initializeContainer };
