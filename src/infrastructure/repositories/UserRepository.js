const User = require('../../domain/models/User');

/**
 * Repository for user data access with performance optimizations
 */
class UserRepository {
  constructor(dynamoTables, logger) {
    this.tables = dynamoTables;
    this.logger = logger || console;
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 seconds
    this.connectionCache = new Map(); // Cache for connectionId -> userId lookups
  }

  /**
   * Save a user
   * @param {User} user - User to save
   * @returns {Promise<User>}
   */
  async saveUser(user) {
    try {
      // Store the user in DynamoDB
      await this.tables.users.put(user);
      
      // Update caches
      this.setCached(user.userId, user);
      this.connectionCache.set(user.connectionId, user.userId);
      
      return user;
    } catch (err) {
      this.logger.error('Failed to save user', { userId: user.userId, error: err.message });
      throw err;
    }
  }

  /**
   * Find a user by ID with caching
   * @param {string} userId - User ID
   * @returns {Promise<User|null>}
   */
  async findById(userId) {
    // Check cache first
    const cached = this.getCached(userId);
    if (cached) return cached;
    
    try {
      const result = await this.tables.users.get({ userId });
      
      if (result) {
        const user = new User(result);
        this.setCached(userId, user);
        return user;
      }
      
      return null;
    } catch (err) {
      this.logger.error('Failed to find user by ID', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Find a user by connection ID with optimized caching
   * @param {string} connectionId - Connection ID
   * @returns {Promise<User|null>}
   */
  async findByConnectionId(connectionId) {
    // Check if we have a cached mapping from connectionId to userId
    const cachedUserId = this.connectionCache.get(connectionId);
    if (cachedUserId) {
      // If we have the mapping, try to get the user from cache
      const cachedUser = this.getCached(cachedUserId);
      if (cachedUser) return cachedUser;
    }
    
    try {
      // Query with GSI if available
      const hasGSI = process.env.USERS_CONNECTION_GSI;
      
      let result;
      if (hasGSI) {
        result = await this.tables.users.query({
          IndexName: 'ConnectionIdIndex',
          KeyConditionExpression: 'connectionId = :connId',
          ExpressionAttributeValues: { ':connId': connectionId },
          Limit: 1
        });
      } else {
        // Fallback to scan with filter
        result = await this.tables.users.scan({
          FilterExpression: 'connectionId = :connId',
          ExpressionAttributeValues: { ':connId': connectionId },
          Limit: 1 // We only need one user
        });
      }
      
      if (result.Items && result.Items.length > 0) {
        const user = new User(result.Items[0]);
        
        // Update caches
        this.setCached(user.userId, user);
        this.connectionCache.set(connectionId, user.userId);
        
        return user;
      }
      
      return null;
    } catch (err) {
      this.logger.error('Failed to find user by connection ID', { 
        connectionId, 
        error: err.message 
      });
      throw err;
    }
  }

  /**
   * Find all users with efficient pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Max users to return
   * @param {string} options.lastEvaluatedKey - Key for pagination
   * @returns {Promise<{users: User[], nextPageKey: string|null}>}
   */
  async findAll(options = { limit: 1000 }) {
    try {
      const scanParams = {
        Limit: options.limit
      };
      
      if (options.lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = options.lastEvaluatedKey;
      }
      
      const result = await this.tables.users.scan(scanParams);
      
      const users = result.Items ? result.Items.map(item => {
        const user = new User(item);
        this.setCached(user.userId, user);
        return user;
      }) : [];
      
      return {
        users,
        nextPageKey: result.LastEvaluatedKey || null
      };
    } catch (err) {
      this.logger.error('Failed to find all users', { error: err.message });
      throw err;
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      // Get the user first to get the connectionId
      const user = await this.findById(userId);
      
      if (user) {
        await this.tables.users.delete({ userId });
        
        // Clean up caches
        this.cache.delete(userId);
        if (user.connectionId) {
          this.connectionCache.delete(user.connectionId);
        }
      }
    } catch (err) {
      this.logger.error('Failed to delete user', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Update specific fields of a user with optimistic locking
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @param {string} [conditionExpression] - Condition for update
   * @returns {Promise<User|null>} - Updated user or null if not found
   */
  async updateUser(userId, updates, conditionExpression = null) {
    // Build update expression and values
    const updateExpressions = [];
    const expressionValues = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      updateExpressions.push(`${key} = :${key}`);
      expressionValues[`:${key}`] = value;
    });
    
    if (updateExpressions.length === 0) {
      return this.findById(userId);
    }
    
    try {
      const updateParams = {
        Key: { userId },
        UpdateExpression: `set ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW'
      };
      
      // Add condition expression if provided
      if (conditionExpression) {
        updateParams.ConditionExpression = conditionExpression;
      }
      
      const result = await this.tables.users.update(updateParams);
      
      if (result.Attributes) {
        const updatedUser = new User(result.Attributes);
        
        // Update cache
        this.setCached(userId, updatedUser);
        
        // Update connection mapping if changed
        if (updates.connectionId && updates.connectionId !== result.Attributes.connectionId) {
          this.connectionCache.delete(result.Attributes.connectionId);
          this.connectionCache.set(updates.connectionId, userId);
        }
        
        return updatedUser;
      }
      
      return null;
    } catch (err) {
      if (err.code === 'ConditionalCheckFailedException') {
        this.logger.warn('Optimistic lock failed for update', { userId });
        return null;
      }
      
      this.logger.error('Failed to update user', { userId, error: err.message });
      throw err;
    }
  }

  // Cache management
  getCached(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  setCached(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheTTL
    });
  }
  
  clearCache() {
    this.cache.clear();
    this.connectionCache.clear();
  }
}

module.exports = UserRepository;
