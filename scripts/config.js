const fs = require('fs');
const path = require('path');

/**
 * Load configuration from various sources
 */
function loadConfig() {
  const config = {
    websocketApiId: null
  };

  // Try to load from prefs file
  try {
    const prefsPath = path.join(__dirname, '..', 'prefs.arc');
    if (fs.existsSync(prefsPath)) {
      const prefs = fs.readFileSync(prefsPath, 'utf8');
      const match = prefs.match(/WEBSOCKET_API_ID\s+([^\s]+)/);
      if (match) {
        config.websocketApiId = match[1];
      }
    }
  } catch (error) {
    console.warn('Could not load preferences:', error);
  }

  // Override with environment variables if present
  if (process.env.WEBSOCKET_API_ID) {
    config.websocketApiId = process.env.WEBSOCKET_API_ID;
  }

  // For testing, use a mock value
  if (process.env.NODE_ENV === 'test') {
    config.websocketApiId = 'test-api-id';
  }

  return config;
}

module.exports = { loadConfig };
