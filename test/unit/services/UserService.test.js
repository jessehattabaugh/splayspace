import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserService from '../../../src/services/UserService';
import User from '../../../src/domain/models/User';

describe('UserService', () => {
  let userService;
  let mockUserRepository;
  let mockMessagingService;
  let mockLogger;
  
  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      saveUser: vi.fn().mockResolvedValue({}),
      findByConnectionId: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      deleteUser: vi.fn().mockResolvedValue({})
    };
    
    mockMessagingService = {
      broadcastMessage: vi.fn().mockResolvedValue({}),
      sendToUser: vi.fn().mockResolvedValue({})
    };
    
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    };
    
    // Create the service with mocks
    userService = new UserService(mockUserRepository, mockMessagingService, mockLogger);
  });
  
  describe('createUser', () => {
    it('should create a user and return it', async () => {
      // Arrange
      const connectionId = 'conn-123';
      const userId = 'user-123';
      const mockUser = new User({ userId, connectionId });
      mockUserRepository.saveUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.createUser(connectionId, userId);
      
      // Assert
      expect(mockUserRepository.saveUser).toHaveBeenCalled();
      expect(result.userId).toBe(userId);
      expect(result.connectionId).toBe(connectionId);
    });
  });
  
  describe('getUserByConnectionId', () => {
    it('should return user when found', async () => {
      // Arrange
      const connectionId = 'conn-123';
      const mockUser = new User({ userId: 'user-123', connectionId });
      mockUserRepository.findByConnectionId.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.getUserByConnectionId(connectionId);
      
      // Assert
      expect(mockUserRepository.findByConnectionId).toHaveBeenCalledWith(connectionId);
      expect(result).toEqual(mockUser);
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      const connectionId = 'conn-123';
      mockUserRepository.findByConnectionId.mockResolvedValue(null);
      
      // Act
      const result = await userService.getUserByConnectionId(connectionId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('notifyUserJoined', () => {
    it('should broadcast USER_JOINED message excluding the new user', async () => {
      // Arrange
      const user = new User({ userId: 'user-123', connectionId: 'conn-123' });
      
      // Act
      await userService.notifyUserJoined(user);
      
      // Assert
      expect(mockMessagingService.broadcastMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'USER_JOINED',
          user: expect.objectContaining({ userId: user.userId })
        }),
        ['conn-123'] // Exclude the new user's connection
      );
    });
  });
  
  describe('handleDisconnect', () => {
    it('should notify others and delete user when found', async () => {
      // Arrange
      const connectionId = 'conn-123';
      const user = new User({ userId: 'user-123', connectionId });
      mockUserRepository.findByConnectionId.mockResolvedValue(user);
      
      // Act
      const result = await userService.handleDisconnect(connectionId);
      
      // Assert
      expect(result).toBe(true);
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(user.userId);
      expect(mockMessagingService.broadcastMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'USER_LEFT',
          userId: user.userId
        }),
        [connectionId]
      );
    });
    
    it('should return false when user not found', async () => {
      // Arrange
      const connectionId = 'conn-123';
      mockUserRepository.findByConnectionId.mockResolvedValue(null);
      
      // Act
      const result = await userService.handleDisconnect(connectionId);
      
      // Assert
      expect(result).toBe(false);
      expect(mockUserRepository.deleteUser).not.toHaveBeenCalled();
    });
  });
});
