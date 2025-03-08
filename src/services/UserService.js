const User = require('../domain/models/User');
const { getRandomColor } = require('../shared/utils');

/**
 * Handles user-related operations
 */
class UserService {
  constructor(userRepository, messagingService, logger) {
    this.userRepository = userRepository;
    this.messagingService = messagingService;
    this.logger = logger;
    console.log('👤 User service initialized 🏗️ constructor');
  }

  /**
   * Create a new user when they connect
   * @param {string} connectionId - WebSocket connection ID
   * @param {string} userId - Unique user ID
   * @returns {Promise<User>} - The created user
   */
  async createUser(connectionId, userId) {
    console.log('👤 Creating new user 🆕 createUser', { userId, connectionId });
    
    const user = new User({
      userId,
      connectionId,
      color: getRandomColor(),
      position: { x: 0, y: 0 },
      inventory: [],
      ownershipWindow: { width: 10, height: 10, level: 'basic' },
      lastActive: Date.now()
    });

    this.logger.info('Creating new user', { userId, connectionId });
    await this.userRepository.saveUser(user);
    return user;
  }

  /**
   * Get a user by connection ID
   * @param {string} connectionId - WebSocket connection ID
   * @returns {Promise<User|null>} - User if found, null otherwise
   */
  async getUserByConnectionId(connectionId) {
    const user = await this.userRepository.findByConnectionId(connectionId);
    
    if (user) {
      console.debug('👤 Found user by connection ID 🔍 getUserByConnectionId', { 
        userId: user.userId,
        connectionId 
      });
    } else {
      console.debug('👤 No user found for connection ID ❓ getUserByConnectionId', { connectionId });
    }
    
    return user;
  }

  /**
   * Get all connected users
   * @returns {Promise<User[]>} - List of connected users
   */
  async getAllUsers() {
    const result = await this.userRepository.findAll();
    console.debug('👤 Retrieved all users 📋 getAllUsers', { count: result.length || 0 });
    return result;
  }

  /**
   * Handle user disconnection
   * @param {string} connectionId - WebSocket connection ID
   * @returns {Promise<boolean>} - True if user was found and removed
   */
  async handleDisconnect(connectionId) {
    console.log('👤 Handling user disconnection 🔌 handleDisconnect', { connectionId });
    
    const user = await this.userRepository.findByConnectionId(connectionId);
    if (!user) {
      console.debug('👤 No user found for disconnection ⚠️ handleDisconnect', { connectionId });
      return false;
    }

    this.logger.info('User disconnecting', { userId: user.userId });
    
    // Notify others about user leaving
    await this.notifyUserLeft(user);
    
    // Remove user from database
    await this.userRepository.deleteUser(user.userId);
    console.log('👤 User removed from database 🗑️ handleDisconnect', { 
      userId: user.userId, 
      connectionId 
    });
    
    return true;
  }

  /**
   * Update user position
   * @param {User} user - The user to update
   * @param {Object} position - New position {x, y}
   * @returns {Promise<User>} - Updated user
   */
  async updatePosition(user, { x, y }) {
    console.debug('👤 Updating user position 🧭 updatePosition', { 
      userId: user.userId, 
      from: { x: user.position.x, y: user.position.y },
      to: { x, y }
    });
    
    user.move(x, y);
    await this.userRepository.saveUser(user);
    return user;
  }

  /**
   * Send existing users to a newly connected user
   * @param {User} newUser - The newly connected user
   * @returns {Promise<void>}
   */
  async sendExistingUsersTo(newUser) {
    console.log('👤 Sending existing users to new user 📨 sendExistingUsersTo', { 
      userId: newUser.userId 
    });
    
    const existingUsers = await this.getAllUsers();
    let sentCount = 0;
    
    for (const existingUser of existingUsers) {
      // Don't send the new user to themselves
      if (existingUser.userId === newUser.userId) continue;
      
      await this.messagingService.sendToUser(newUser.connectionId, {
        type: 'USER_JOINED',
        user: existingUser.toPublic()
      });
      sentCount++;
    }
    
    console.debug('👤 Sent existing users to new user 📬 sendExistingUsersTo', { 
      userId: newUser.userId,
      sentCount
    });
  }

  /**
   * Notify all users about a new user
   * @param {User} newUser - The new user
   * @returns {Promise<void>}
   */
  async notifyUserJoined(newUser) {
    console.log('👤 Notifying others about new user 📣 notifyUserJoined', { 
      userId: newUser.userId 
    });
    
    this.logger.info('Notifying others about new user', { userId: newUser.userId });
    
    await this.messagingService.broadcastMessage({
      type: 'USER_JOINED',
      user: newUser.toPublic()
    }, [newUser.connectionId]);
  }

  /**
   * Notify all users about a user leaving
   * @param {User} user - The user who left
   * @returns {Promise<void>}
   */
  async notifyUserLeft(user) {
    console.log('👤 Notifying others about user leaving 👋 notifyUserLeft', { 
      userId: user.userId 
    });
    
    this.logger.info('Notifying others about user leaving', { userId: user.userId });
    
    await this.messagingService.broadcastMessage({
      type: 'USER_LEFT',
      userId: user.userId
    }, [user.connectionId]);
  }

  /**
   * Notify other users about a user's movement
   * @param {User} user - The user who moved
   * @returns {Promise<void>}
   */
  async notifyUserMoved(user) {
    console.debug('👤 Notifying others about user movement 🚶 notifyUserMoved', { 
      userId: user.userId,
      position: user.position
    });
    
    await this.messagingService.broadcastMessage({
      type: 'USER_MOVED',
      userId: user.userId,
      position: user.position
    }, [user.connectionId]);
  }
}

module.exports = UserService;
