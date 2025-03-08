/**
 * Test environment utilities for Playwright tests
 */

/**
 * Get the base URL for tests from environment variables or defaults
 */
export function getTestEnvironment() {
  // Get environment from env variable or default to staging
  const environment = process.env.SPLAY_TEST_ENV || 'staging';
  
  // Map of environments to base URLs
  const environments = {
    local: 'http://localhost:3333',
    staging: 'https://staging.splayspace.com', // Update with your actual staging URL
    production: 'https://splayspace.com', // Update with your actual production URL
  };
  
  // If a specific URL is provided, use that instead
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return {
      name: 'custom',
      baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL,
      wsUrl: process.env.PLAYWRIGHT_TEST_WS_URL || getWebSocketUrl(process.env.PLAYWRIGHT_TEST_BASE_URL)
    };
  }
  
  // Get the base URL for the selected environment
  const baseUrl = environments[environment] || environments.staging;
  
  return {
    name: environment,
    baseUrl,
    wsUrl: getWebSocketUrl(baseUrl)
  };
}

/**
 * Derive WebSocket URL from HTTP URL
 */
function getWebSocketUrl(httpUrl) {
  if (!httpUrl) return null;
  
  // Convert http/https to ws/wss
  return httpUrl.replace(/^http/, 'ws');
}

/**
 * Wait for a specific event from the WebSocket
 * @param {Page} page - Playwright page object
 * @param {string} eventType - Event type to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<any>} - Event data
 */
export async function waitForWebSocketEvent(page, eventType, timeout = 5000) {
  return await page.evaluate(
    ([eventType, timeout]) => {
      return new Promise((resolve, reject) => {
        // Create a handler for the message event
        const handleMessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === eventType) {
              window.removeEventListener('message:received', handleMessage);
              resolve(data);
            }
          } catch (e) {
            // Ignore parse errors
          }
        };
        
        // Listen for custom events from our WebSocket wrapper
        window.addEventListener('message:received', handleMessage);
        
        // Set a timeout
        setTimeout(() => {
          window.removeEventListener('message:received', handleMessage);
          reject(new Error(`Timeout waiting for WebSocket event: ${eventType}`));
        }, timeout);
      });
    },
    [eventType, timeout]
  );
}

/**
 * Inject WebSocket monitoring code into page
 * @param {Page} page - Playwright page object
 */
export async function injectWebSocketMonitoring(page) {
  await page.addInitScript(() => {
    // Store original WebSocket
    const OrigWebSocket = window.WebSocket;
    
    // Create a proxy WebSocket that emits events we can listen for
    window.WebSocket = function(url, protocols) {
      const ws = new OrigWebSocket(url, protocols);
      
      // Add event listeners to proxy events to window
      ws.addEventListener('open', (event) => {
        const customEvent = new CustomEvent('websocket:open', { detail: { url } });
        window.dispatchEvent(customEvent);
      });
      
      ws.addEventListener('close', (event) => {
        const customEvent = new CustomEvent('websocket:close', { 
          detail: { code: event.code, reason: event.reason } 
        });
        window.dispatchEvent(customEvent);
      });
      
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          const customEvent = new CustomEvent('message:received', { 
            detail: data 
          });
          window.dispatchEvent(customEvent);
        } catch (e) {
          // Ignore parse errors for non-JSON messages
        }
      });
      
      // Store original send method
      const originalSend = ws.send;
      
      // Override send to capture outgoing messages
      ws.send = function(data) {
        try {
          const parsedData = JSON.parse(data);
          const customEvent = new CustomEvent('message:sent', { 
            detail: parsedData 
          });
          window.dispatchEvent(customEvent);
        } catch (e) {
          // Ignore parse errors for non-JSON messages
        }
        
        // Call original send
        return originalSend.call(this, data);
      };
      
      return ws;
    };
    
    // Copy static properties from original WebSocket
    Object.defineProperties(window.WebSocket, {
      CONNECTING: { value: OrigWebSocket.CONNECTING },
      OPEN: { value: OrigWebSocket.OPEN },
      CLOSING: { value: OrigWebSocket.CLOSING },
      CLOSED: { value: OrigWebSocket.CLOSED }
    });
  });
}
