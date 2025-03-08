/**
 * Rate limiter to prevent abuse
 */
class RateLimiter {
  /**
   * Create a rate limiter
   * @param {Object} options - Rate limiter options
   * @param {number} options.maxRequests - Maximum number of requests in window
   * @param {number} options.timeWindowMs - Time window in milliseconds
   * @param {Object} [options.logger] - Logger instance
   */
  constructor(options = { maxRequests: 100, timeWindowMs: 60000 }) {
    this.maxRequests = options.maxRequests;
    this.timeWindowMs = options.timeWindowMs;
    this.logger = options.logger || console;
    this.requestCounts = new Map();
    
    console.log('⏱️ Rate limiter initialized 🚦 constructor', { 
      maxRequests: this.maxRequests, 
      windowMs: this.timeWindowMs 
    });
    
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.timeWindowMs);
  }
  
  /**
   * Check if a request is allowed
   * @param {string} clientId - Client identifier (connectionId, IP, etc)
   * @returns {boolean} Whether request is allowed
   */
  allowRequest(clientId) {
    const now = Date.now();
    const entry = this.requestCounts.get(clientId);
    
    if (!entry) {
      // First request from this client
      this.requestCounts.set(clientId, {
        count: 1,
        firstRequest: now
      });
      console.debug('⏱️ First request from client 🆕 allowRequest', { clientId });
      return true;
    }
    
    // Check if window has expired
    if (now - entry.firstRequest > this.timeWindowMs) {
      // Reset for a new window
      this.requestCounts.set(clientId, {
        count: 1,
        firstRequest: now
      });
      console.debug('⏱️ Rate limit window reset 🔄 allowRequest', { clientId });
      return true;
    }
    
    // Increment count
    entry.count++;
    
    // Check if approaching limit (80%)
    if (entry.count > this.maxRequests * 0.8 && entry.count <= this.maxRequests) {
      console.debug('⏱️ Client approaching rate limit ⚠️ allowRequest', { 
        clientId, 
        count: entry.count,
        limit: this.maxRequests
      });
    }
    
    // Check if over limit
    if (entry.count > this.maxRequests) {
      console.log('⏱️ Rate limit exceeded 🛑 allowRequest', { 
        clientId, 
        count: entry.count,
        limit: this.maxRequests,
        windowMs: this.timeWindowMs 
      });
      
      this.logger.warn('Rate limit exceeded', { 
        clientId, 
        count: entry.count,
        limit: this.maxRequests,
        windowMs: this.timeWindowMs 
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredTime = now - this.timeWindowMs;
    const initialSize = this.requestCounts.size;
    
    for (const [clientId, entry] of this.requestCounts.entries()) {
      if (entry.firstRequest < expiredTime) {
        this.requestCounts.delete(clientId);
      }
    }
    
    const removedCount = initialSize - this.requestCounts.size;
    if (removedCount > 0) {
      console.debug('⏱️ Cleaned up expired rate limit entries 🧹 cleanup', { 
        removedCount, 
        remainingClients: this.requestCounts.size
      });
    }
  }
  
  /**
   * Get current rate limit status for a client
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Rate limit status or null if no requests
   */
  getClientStatus(clientId) {
    const entry = this.requestCounts.get(clientId);
    if (!entry) return null;
    
    const now = Date.now();
    const timeElapsed = now - entry.firstRequest;
    const timeRemaining = Math.max(0, this.timeWindowMs - timeElapsed);
    
    return {
      requestCount: entry.count,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      timeElapsedMs: timeElapsed,
      timeRemainingMs: timeRemaining,
      resetAt: new Date(now + timeRemaining)
    };
  }
}

module.exports = RateLimiter;
