/**
 * Handles chat-related operations
 */
class ChatService {
  constructor(messagingService, logger) {
    this.messagingService = messagingService;
    this.logger = logger || console;
    console.log('💬 Chat service initialized 🎭 constructor');
  }

  /**
   * Send a chat message from a user to all connected users
   * @param {string} message - The message text
   * @param {User} sender - The user sending the message
   * @returns {Promise<void>}
   */
  async sendMessage(message, sender) {
    console.log('💬 Broadcasting chat message 📣 sendMessage', { 
      userId: sender.userId, 
      messageLength: message.length 
    });
    
    // Check for moderation if needed
    if (this.shouldModerateMessage(message)) {
      console.log('💬 Message flagged for moderation 🚩 sendMessage', { userId: sender.userId });
      this.logger.warn('Message flagged for moderation', { userId: sender.userId, message });
      
      // Send a private message to the user
      await this.messagingService.sendToUser(sender.connectionId, {
        type: 'CHAT_MESSAGE',
        userId: 'SYSTEM',
        message: 'Your message was flagged for moderation.',
        timestamp: Date.now()
      });
      
      return;
    }
    
    await this.messagingService.broadcastMessage({
      type: 'CHAT_MESSAGE',
      userId: sender.userId,
      message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Basic moderation check
   * @private
   * @param {string} message - Message to check
   * @returns {boolean} - True if message should be moderated
   */
  shouldModerateMessage(message) {
    const lowercaseMsg = message.toLowerCase();
    
    // Example basic moderation rules
    const forbiddenTerms = [
      'badword1',
      'badword2',
      // Add more terms as needed
    ];
    
    return forbiddenTerms.some(term => lowercaseMsg.includes(term));
  }
}

module.exports = ChatService;
