/**
 * Logger service for consistent logging across the application
 */
class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Check if current log level allows logging at specified level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether logging is allowed
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format log message with metadata
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   * @returns {Object} Formatted log object
   */
  formatLog(level, message, meta) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  /**
   * Log at error level
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or metadata
   */
  error(message, error) {
    if (!this.shouldLog('error')) return;
    
    const meta = error instanceof Error ? {
      errorMessage: error.message,
      stack: error.stack,
      code: error.code
    } : error;
    
    const logObj = this.formatLog('error', message, meta);
    console.error(JSON.stringify(logObj));
  }

  /**
   * Log at warn level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta) {
    if (!this.shouldLog('warn')) return;
    const logObj = this.formatLog('warn', message, meta);
    console.warn(JSON.stringify(logObj));
  }

  /**
   * Log at info level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta) {
    if (!this.shouldLog('info')) return;
    const logObj = this.formatLog('info', message, meta);
    console.log(JSON.stringify(logObj));
  }

  /**
   * Log at debug level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta) {
    if (!this.shouldLog('debug')) return;
    const logObj = this.formatLog('debug', message, meta);
    console.log(JSON.stringify(logObj));
  }
}

module.exports = Logger;
