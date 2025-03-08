/**
 * Dependency Injection container to manage service initialization
 */
const arc = require('@architect/functions');
const WebSocketService = require('./WebSocketService');
const UserRepository = require('./repositories/UserRepository');
const WorldRepository = require('./repositories/WorldRepository');
const ResourceRepository = require('./repositories/ResourceRepository');
const MessageRepository = require('./repositories/MessageRepository');
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
    const messagingService = new WebSocketService(arc, logger);
    
    // Initialize repositories
    const userRepository = new UserRepository(tables, logger);
    const worldRepository = new WorldRepository(tables, logger);
    const resourceRepository = new ResourceRepository(tables, logger);
    const messageRepository = new MessageRepository(messagingService, logger);
    
    // Initialize domain services
    const userService = new UserService(userRepository, messageRepository, logger);
    const worldService = new WorldService(worldRepository, messageRepository, logger);
    const resourceService = new ResourceService(
      resourceRepository, 
      userRepository,
      messageRepository,
      logger
    );
    const chatService = new ChatService(messageRepository, logger);
    
    // Return container with all services
    return {
      tables,
      logger,
      repositories: {
        userRepository,
        worldRepository,
        resourceRepository,
        messageRepository
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
